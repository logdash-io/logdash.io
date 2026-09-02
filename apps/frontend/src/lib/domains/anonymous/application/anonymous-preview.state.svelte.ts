import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';
import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error';
import { createLogger } from '$lib/domains/shared/logger';
import { posthog } from 'posthog-js';
import {
  AnonymousStartError,
  previewNameFromUrl,
  type AnonymousPreview,
  type AnonymousStartStep,
} from '../domain/anonymous-preview';
import { anonymousSessionService } from '../infrastructure/anonymous-session.service';
import { startAnonymousMonitoring } from './start-anonymous-monitoring';

const logger = createLogger('anonymous-preview.state', false);

const PREVIEW_STORAGE_KEY = 'logdash_anonymous_preview_v0';
const PREVIEW_POLL_INTERVAL_MS = 5_000;
const DEMO_POLL_INTERVAL_MS = 10_000;

export type AnonymousPreviewPhase =
  | 'idle'
  | 'creating'
  | 'previewing'
  | 'ended'
  | 'error';

export type AnonymousPreviewSource = 'hero' | 'final-cta';

export type AnonymousPreviewDemo = {
  monitor: Monitor | null;
  pings: HttpPing[];
};

type StoredAnonymousPreview = {
  preview: AnonymousPreview;
  createdAt: number;
};

class AnonymousPreviewState {
  private _phase = $state<AnonymousPreviewPhase>('idle');
  private _preview = $state<AnonymousPreview | null>(null);
  private _pings = $state<HttpPing[]>([]);
  private _creatingStep = $state<AnonymousStartStep | null>(null);
  private _error = $state<AnonymousStartError | null>(null);
  private _demo = $state<AnonymousPreviewDemo>({ monitor: null, pings: [] });
  private _initialized = false;
  private _previewPollTimer: ReturnType<typeof setInterval> | null = null;
  private _demoPollTimer: ReturnType<typeof setInterval> | null = null;

  public get phase(): AnonymousPreviewPhase {
    return this._phase;
  }

  public get preview(): AnonymousPreview | null {
    return this._preview;
  }

  public get pings(): HttpPing[] {
    return this._pings;
  }

  public get creatingStep(): AnonymousStartStep | null {
    return this._creatingStep;
  }

  public get error(): AnonymousStartError | null {
    return this._error;
  }

  public get demo(): AnonymousPreviewDemo {
    return this._demo;
  }

  public init(): void {
    if (this._initialized) {
      return;
    }

    this._initialized = true;
    this._restorePreview();

    if (this._phase === 'previewing') {
      this._startPreviewPolling();
      return;
    }

    this._startDemoPolling();
  }

  public destroy(): void {
    this._initialized = false;
    this._stopPreviewPolling();
    this._stopDemoPolling();
  }

  public async submit(
    url: string,
    source: AnonymousPreviewSource,
  ): Promise<void> {
    if (this._phase === 'creating') {
      return;
    }

    this._stopDemoPolling();
    this._error = null;
    this._pings = [];
    this._creatingStep = 'account';
    this._phase = 'creating';

    let preview: AnonymousPreview;

    try {
      preview = await startAnonymousMonitoring({
        url,
        onStep: (step) => {
          this._creatingStep = step;
        },
      });
    } catch (error) {
      logger.error('Failed to create the anonymous dashboard', error);

      this._creatingStep = null;
      this._error = this._toStartError(error);
      this._phase = 'error';

      return;
    }

    this._preview = preview;
    this._creatingStep = null;
    this._phase = 'previewing';
    this._persistPreview(preview);

    posthog.capture('anonymous_dashboard_created', { source });

    this._startPreviewPolling();
  }

  public async openDashboard(): Promise<void> {
    const preview = this._preview;

    if (!preview) {
      return;
    }

    posthog.capture('anonymous_dashboard_opened');

    let claimed: AnonymousPreview;

    try {
      claimed = await this._claimPreviewMonitor(preview);
    } catch (error) {
      logger.error('Failed to open the anonymous dashboard', error);

      this._error = this._toStartError(error);
      this._phase = 'error';

      return;
    }

    this._stopPreviewPolling();
    this._preview = claimed;
    this._phase = 'ended';
    this._clearStoredPreview();

    await goto(
      resolve(
        `/app/clusters/${claimed.clusterId}/${claimed.projectId}/monitoring`,
      ),
    );
  }

  public retry(): void {
    this._stopPreviewPolling();
    this._clearStoredPreview();

    this._error = null;
    this._preview = null;
    this._pings = [];
    this._creatingStep = null;
    this._phase = 'idle';

    this._startDemoPolling();
  }

  private async _claimPreviewMonitor(
    preview: AnonymousPreview,
  ): Promise<AnonymousPreview> {
    try {
      await anonymousSessionService.claimMonitor(
        preview.monitorId,
        preview.token,
      );

      return preview;
    } catch (error) {
      if (readHttpErrorStatus(error) !== 404) {
        throw error;
      }

      const monitor = await anonymousSessionService.createMonitor(
        preview.projectId,
        { name: previewNameFromUrl(preview.url), url: preview.url },
        preview.token,
      );

      await anonymousSessionService.claimMonitor(monitor.id, preview.token);

      return { ...preview, monitorId: monitor.id };
    }
  }

  private _startPreviewPolling(): void {
    this._stopPreviewPolling();

    void this._refreshPings();

    this._previewPollTimer = setInterval(() => {
      void this._refreshPings();
    }, PREVIEW_POLL_INTERVAL_MS);
  }

  private _stopPreviewPolling(): void {
    if (!this._previewPollTimer) {
      return;
    }

    clearInterval(this._previewPollTimer);
    this._previewPollTimer = null;
  }

  private async _refreshPings(): Promise<void> {
    const preview = this._preview;

    if (!preview) {
      return;
    }

    try {
      this._pings = await anonymousSessionService.readPings(
        preview.projectId,
        preview.monitorId,
        preview.token,
      );
    } catch (error) {
      logger.debug('Failed to read the preview pings', error);

      if (readHttpErrorStatus(error) !== 404) {
        return;
      }

      this._stopPreviewPolling();
      this._phase = 'ended';
    }
  }

  private _startDemoPolling(): void {
    this._stopDemoPolling();

    void this._refreshDemo();

    this._demoPollTimer = setInterval(() => {
      void this._refreshDemo();
    }, DEMO_POLL_INTERVAL_MS);
  }

  private _stopDemoPolling(): void {
    if (!this._demoPollTimer) {
      return;
    }

    clearInterval(this._demoPollTimer);
    this._demoPollTimer = null;
  }

  private async _refreshDemo(): Promise<void> {
    try {
      const target = await anonymousSessionService.readDemo();
      const monitors = await anonymousSessionService.readDemoMonitors(
        target.clusterId,
      );
      const monitor =
        monitors.find(
          (candidate) => candidate.projectId === target.projectId,
        ) ?? null;

      if (!monitor) {
        this._demo = { monitor: null, pings: [] };
        return;
      }

      const pings = await anonymousSessionService.readDemoPings(
        target.projectId,
        monitor.id,
      );

      this._demo = { monitor, pings };
    } catch (error) {
      logger.debug('Failed to refresh the demo showcase', error);
    }
  }

  private _restorePreview(): void {
    const stored = this._readStoredPreview();

    if (!stored) {
      return;
    }

    this._preview = stored.preview;
    this._phase = 'previewing';
  }

  private _readStoredPreview(): StoredAnonymousPreview | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const stored = JSON.parse(raw) as StoredAnonymousPreview;

      if (!stored?.preview?.token || !stored.preview.monitorId) {
        this._clearStoredPreview();
        return null;
      }

      return stored;
    } catch (error) {
      logger.debug('Failed to read the stored preview', error);
      this._clearStoredPreview();

      return null;
    }
  }

  private _persistPreview(preview: AnonymousPreview): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const stored: StoredAnonymousPreview = { preview, createdAt: Date.now() };

    sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(stored));
  }

  private _clearStoredPreview(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
  }

  private _toStartError(error: unknown): AnonymousStartError {
    if (error instanceof AnonymousStartError) {
      return error;
    }

    return AnonymousStartError.fromStatus(readHttpErrorStatus(error));
  }
}

export const anonymousPreviewState = new AnonymousPreviewState();
