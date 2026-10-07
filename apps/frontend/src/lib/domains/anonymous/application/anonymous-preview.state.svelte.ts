import { resolve } from '$app/paths';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';
import type { PingBucket } from '$lib/domains/app/projects/domain/monitoring/ping-bucket';
import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error';
import { createLogger } from '$lib/domains/shared/logger';
import {
  AnonymousStartError,
  type AnonymousPreview,
  type AnonymousStartStep,
} from '../domain/anonymous-preview';
import {
  clusterNameFromUrl,
  previewNameFromUrl,
} from '$lib/domains/shared/utils/address-names';
import { watchHistory, type WatchHistory } from '../domain/watch-history';
import { anonymousSessionService } from '../infrastructure/anonymous-session.service';
import { writePreviewAddress } from './preview-address';
import { startAnonymousMonitoring } from './start-anonymous-monitoring';

const logger = createLogger('anonymous-preview.state', false);

const PREVIEW_STORAGE_KEY = 'logdash_anonymous_preview_v0';
const PREVIEW_POLL_INTERVAL_MS = 5_000;
const FIRST_CHECK_POLL_INTERVAL_MS = 1_000;
const HISTORY_POLL_EVERY = 12;
const DEMO_POLL_INTERVAL_MS = 5_000;

export type AnonymousPreviewPhase =
  | 'idle'
  | 'creating'
  | 'previewing'
  | 'ended'
  | 'error';

export type AnonymousPreviewSource =
  | 'hero'
  | 'final-cta'
  | 'seo'
  | 'feature'
  | 'link';

export type AnonymousPreviewDemo = {
  monitor: Monitor | null;
  pings: HttpPing[];
  hours: (PingBucket | null)[];
  loaded: boolean;
};

type DemoTarget = {
  clusterId: string;
  monitorId: string | null;
};

type PreviewHistory = {
  hours: (PingBucket | null)[];
  days: (PingBucket | null)[];
};

type StoredAnonymousPreview = {
  preview: AnonymousPreview;
  createdAt: number;
};

class AnonymousPreviewState {
  private _phase = $state<AnonymousPreviewPhase>('idle');
  private _preview = $state<AnonymousPreview | null>(null);
  private _submittedUrl = $state<string | null>(null);
  private _clusterName = $state<string | null>(null);
  private _pings = $state<HttpPing[]>([]);
  private _history = $state<PreviewHistory>({ hours: [], days: [] });
  private _creatingStep = $state<AnonymousStartStep | null>(null);
  private _error = $state<AnonymousStartError | null>(null);
  private _demo = $state<AnonymousPreviewDemo>({
    monitor: null,
    pings: [],
    hours: [],
    loaded: false,
  });
  private _demoPolls = 0;
  private _demoTarget: DemoTarget | null = null;
  private _initialized = false;
  private _previewPollTimer: ReturnType<typeof setInterval> | null = null;
  private _previewPolls = 0;
  /** Polls can overlap at the fast rate, so an older answer must not win. */
  private _pingsRequested = 0;
  private _pingsApplied = 0;
  private _demoPollTimer: ReturnType<typeof setInterval> | null = null;

  public get phase(): AnonymousPreviewPhase {
    return this._phase;
  }

  public get preview(): AnonymousPreview | null {
    return this._preview;
  }

  public get previewHost(): string | null {
    if (this._preview) {
      return previewNameFromUrl(this._preview.url);
    }

    if (this._submittedUrl) {
      return previewNameFromUrl(this._submittedUrl);
    }

    return null;
  }

  public get previewUrl(): string | null {
    return this._preview?.url ?? this._submittedUrl;
  }

  public get clusterName(): string | null {
    return this._clusterName;
  }

  public get pings(): HttpPing[] {
    return this._pings;
  }

  public get previewHours(): (PingBucket | null)[] {
    return this._history.hours;
  }

  public get watchHistory(): WatchHistory | null {
    return this._preview
      ? watchHistory(
          this._history.hours,
          this._history.days,
          this._preview.createdAt,
        )
      : null;
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

  public isShowing(url: string): boolean {
    return (this._preview?.url ?? this._submittedUrl) === url;
  }

  public init(): void {
    if (this._initialized) {
      return;
    }

    this._initialized = true;
    this._watchVisibility();
    this._restorePreview();

    if (this._phase === 'previewing') {
      this._startPreviewPolling();
      return;
    }

    if (this._phase === 'idle') {
      this._startDemoPolling();
    }
  }

  public destroy(): void {
    this._initialized = false;
    this._unwatchVisibility();
    this._stopPreviewPolling();
    this._stopDemoPolling();
  }

  public async submit(url: string): Promise<void> {
    if (this._phase === 'creating') {
      return;
    }

    this._stopPreviewPolling();
    this._stopDemoPolling();
    this._clearStoredPreview();

    this._preview = null;
    this._submittedUrl = url;
    this._pings = [];
    this._history = { hours: [], days: [] };
    this._error = null;
    this._creatingStep = 'account';
    this._phase = 'creating';

    let preview: AnonymousPreview;

    try {
      preview = await startAnonymousMonitoring({
        url,
        onStep: (step) => {
          this._creatingStep = step;
        },
        onClusterName: (clusterName) => {
          this._clusterName = clusterName;
        },
      });
    } catch (error) {
      logger.error('Failed to create the anonymous dashboard', error);

      this._creatingStep = null;
      this._error = AnonymousStartError.from(error);
      this._phase = 'error';

      return;
    }

    this._preview = preview;
    this._creatingStep = null;
    this._phase = 'previewing';
    this._persistPreview(preview);

    window.logdash?.track('preview_dashboard_created');

    this._startPreviewPolling();
  }

  public async openDashboard(): Promise<void> {
    const claimed = await this._claimForHandoff();

    if (!claimed) {
      return;
    }

    window.location.assign(
      resolve(`/app/domains/${claimed.clusterId}/uptime/${claimed.monitorId}`),
    );
  }

  public adoptSessionToken(token: string): void {
    if (!this._preview) {
      return;
    }

    this._preview = { ...this._preview, token };
  }

  public handOffPreview(): void {
    this._stopPreviewPolling();
    this._stopDemoPolling();
    this._clearStoredPreview();
    writePreviewAddress(null);
  }

  public retry(): void {
    this._resetToIdle();
    this._startDemoPolling();
  }

  private async _claimForHandoff(): Promise<AnonymousPreview | null> {
    const preview = this._preview;

    if (!preview) {
      return null;
    }

    let claimed: AnonymousPreview;

    try {
      claimed = await this._claimPreviewMonitor(preview);
    } catch (error) {
      logger.error('Failed to open the anonymous dashboard', error);

      this._stopPreviewPolling();
      this._error = AnonymousStartError.fromClaim(error);
      this._phase = 'error';

      return null;
    }

    this.handOffPreview();

    return claimed;
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
      if (!this._isMonitorGone(error)) {
        throw error;
      }

      const monitor = await anonymousSessionService.createMonitor(
        preview.clusterId,
        { name: previewNameFromUrl(preview.url), url: preview.url },
        preview.token,
      );

      await anonymousSessionService.claimMonitor(monitor.id, preview.token);

      return { ...preview, monitorId: monitor.id };
    }
  }

  private _isMonitorGone(error: unknown): boolean {
    const status = readHttpErrorStatus(error);

    return status === 403 || status === 404;
  }

  private _resetToIdle(): void {
    this._stopPreviewPolling();
    this._clearStoredPreview();

    this._preview = null;
    this._submittedUrl = null;
    this._clusterName = null;
    this._pings = [];
    this._history = { hours: [], days: [] };
    this._creatingStep = null;
    this._error = null;
    this._phase = 'idle';
    writePreviewAddress(null);
  }

  private _startPreviewPolling(): void {
    this._stopPreviewPolling();

    if (this._isHidden()) {
      return;
    }

    this._previewPolls = 0;
    void this._refreshPreview();
    this._schedulePreviewPolls();
  }

  private _schedulePreviewPolls(): void {
    this._stopPreviewPolling();

    this._previewPollTimer = setInterval(
      () => {
        void this._refreshPreview();
      },
      this._pings.length
        ? PREVIEW_POLL_INTERVAL_MS
        : FIRST_CHECK_POLL_INTERVAL_MS,
    );
  }

  private _stopPreviewPolling(): void {
    if (!this._previewPollTimer) {
      return;
    }

    clearInterval(this._previewPollTimer);
    this._previewPollTimer = null;
  }

  private async _refreshPreview(): Promise<void> {
    const withHistory = this._previewPolls % HISTORY_POLL_EVERY === 0;
    this._previewPolls += 1;

    await Promise.all([
      this._refreshPings(),
      withHistory ? this._refreshHistory() : Promise.resolve(),
    ]);
  }

  private async _refreshHistory(): Promise<void> {
    const preview = this._preview;

    if (!preview || !this._isLivePreview(preview)) {
      return;
    }

    try {
      const [hours, days] = await Promise.all([
        anonymousSessionService.readHistory(
          preview.monitorId,
          '90h',
          preview.token,
        ),
        anonymousSessionService.readHistory(
          preview.monitorId,
          '90d',
          preview.token,
        ),
      ]);

      if (this._isLivePreview(preview)) {
        this._history = { hours, days };
      }
    } catch (error) {
      logger.debug('Failed to read the preview history', error);
    }
  }

  private async _refreshPings(): Promise<void> {
    const preview = this._preview;

    if (!preview || !this._isLivePreview(preview)) {
      return;
    }

    const request = ++this._pingsRequested;

    try {
      const pings = await anonymousSessionService.readPings(
        preview.clusterId,
        preview.monitorId,
        preview.token,
      );

      if (!this._isLivePreview(preview) || request < this._pingsApplied) {
        return;
      }

      this._pingsApplied = request;

      const isFirstCheck = !this._pings.length && pings.length > 0;

      this._pings = pings;

      if (isFirstCheck && this._previewPollTimer) {
        this._schedulePreviewPolls();
      }
    } catch (error) {
      logger.debug('Failed to read the preview pings', error);

      if (!this._isLivePreview(preview) || readHttpErrorStatus(error) !== 404) {
        return;
      }

      this._stopPreviewPolling();
      this._phase = 'ended';
    }
  }

  private _isLivePreview(preview: AnonymousPreview): boolean {
    return (
      this._phase === 'previewing' &&
      this._preview?.monitorId === preview.monitorId
    );
  }

  private _startDemoPolling(): void {
    this._stopDemoPolling();

    if (this._isHidden()) {
      return;
    }

    this._demoPolls = 0;
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
    if (!this._demoTarget) {
      await this._loadDemoTarget();
    }

    const withHistory = this._demoPolls % HISTORY_POLL_EVERY === 0;
    this._demoPolls += 1;

    await Promise.all([
      this._refreshDemoPings(),
      withHistory ? this._refreshDemoHistory() : Promise.resolve(),
    ]);
  }

  private async _refreshDemoHistory(): Promise<void> {
    const target = this._demoTarget;

    if (!target?.monitorId) {
      return;
    }

    try {
      this._demo.hours = await anonymousSessionService.readDemoHistory(
        target.clusterId,
        target.monitorId,
      );
    } catch (error) {
      logger.debug('Failed to refresh the demo history', error);
    }
  }

  private async _loadDemoTarget(): Promise<void> {
    try {
      const target = await anonymousSessionService.readDemo();
      const monitors = await anonymousSessionService.readDemoMonitors(
        target.clusterId,
      );
      const monitor =
        monitors.find(
          (candidate) => candidate.projectId === target.projectId,
        ) ??
        monitors[0] ??
        null;

      this._demoTarget = {
        clusterId: target.clusterId,
        monitorId: monitor?.id ?? null,
      };
      this._demo.monitor = monitor;
    } catch (error) {
      logger.debug('Failed to load the demo showcase', error);
    } finally {
      this._demo.loaded = true;
    }
  }

  private async _refreshDemoPings(): Promise<void> {
    const target = this._demoTarget;

    if (!target?.monitorId) {
      return;
    }

    try {
      this._demo.pings = await anonymousSessionService.readDemoPings(
        target.clusterId,
        target.monitorId,
      );
    } catch (error) {
      logger.debug('Failed to refresh the demo pings', error);
    }
  }

  private _watchVisibility(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  private _unwatchVisibility(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.removeEventListener('visibilitychange', this._onVisibilityChange);
  }

  private _onVisibilityChange = (): void => {
    if (this._isHidden()) {
      this._stopPreviewPolling();
      this._stopDemoPolling();
      return;
    }

    if (this._phase === 'previewing') {
      this._startPreviewPolling();
      return;
    }

    if (this._phase === 'idle') {
      this._startDemoPolling();
    }
  };

  private _isHidden(): boolean {
    return typeof document !== 'undefined' && document.hidden;
  }

  private _restorePreview(): void {
    const stored = this._readStoredPreview();

    if (!stored) {
      return;
    }

    this._preview = stored.preview;
    this._clusterName = stored.preview.clusterName || null;
    this._phase = 'previewing';

    if (!this._clusterName) {
      void this._nameStoredPreview(stored.preview);
    }
  }

  private async _nameStoredPreview(preview: AnonymousPreview): Promise<void> {
    const clusterName = await clusterNameFromUrl(preview.url);

    if (this._preview?.monitorId === preview.monitorId) {
      this._clusterName = clusterName;
    }
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
}

export const anonymousPreviewState = new AnonymousPreviewState();
