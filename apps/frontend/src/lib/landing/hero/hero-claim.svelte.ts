import { resolve } from '$app/paths';
import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
import {
  sessionService,
  type SessionProbe,
} from '$lib/domains/anonymous/infrastructure/session.service';
import {
  startOAuthPopup,
  type OAuthPopupHandle,
  type OAuthPopupOutcome,
} from '$lib/domains/auth/application/start-oauth-popup';
import { startOAuthLogin } from '$lib/domains/auth/application/start-oauth-login';
import type { OAuthFailureReason } from '$lib/domains/auth/domain/oauth-popup-message';
import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
import { needsOnboarding } from '$lib/domains/onboarding/application/needs-onboarding';
import { createLogger } from '$lib/domains/shared/logger';
import type { User } from '$lib/domains/shared/user/domain/user';
import { posthog } from 'posthog-js';
import { match } from 'ts-pattern';

export type HeroClaimStep =
  | { kind: 'intro' }
  | { kind: 'waiting'; provider: OAuthProvider }
  | { kind: 'onboarding'; user: User }
  | { kind: 'busy'; label: string };

export type HeroClaimTrigger = 'nudge' | 'alerts';

const logger = createLogger('hero-claim.state', false);

const PROJECT_LIMIT_MESSAGE =
  'That account has reached its project limit. Free a slot there, then try again.';
const FAILED_MESSAGE =
  'Signing in did not go through. Your dashboard is untouched. Try again.';

class HeroClaimState {
  private _open = $state(false);
  private _step = $state.raw<HeroClaimStep>({ kind: 'intro' });
  private _error = $state<string | null>(null);
  private _handle: OAuthPopupHandle | null = null;
  private _nudged = new Set<string>();

  public get eligible(): boolean {
    return (
      anonymousPreviewState.phase === 'previewing' &&
      anonymousPreviewState.preview?.anonymous !== false
    );
  }

  public get visible(): boolean {
    return this._open && this.eligible;
  }

  public get step(): HeroClaimStep {
    return this._step;
  }

  public get error(): string | null {
    return this._error;
  }

  public get closable(): boolean {
    return this._step.kind !== 'busy';
  }

  public nudge(key: string): void {
    if (this._nudged.has(key)) {
      return;
    }

    this._nudged.add(key);
    this.show('nudge');
  }

  public show(trigger: HeroClaimTrigger): void {
    if (this._open || !this.eligible) {
      return;
    }

    this._open = true;
    posthog.capture('anonymous_claim_card_shown', { trigger });
  }

  public hide(): void {
    if (!this.closable) {
      return;
    }

    if (this._step.kind === 'waiting') {
      this.cancel();
    }

    this._error = null;
    this._open = false;
  }

  public start(provider: OAuthProvider): void {
    if (this._step.kind !== 'intro') {
      return;
    }

    const handle = startOAuthPopup({ provider, flow: 'claim' });

    this._handle = handle;
    this._error = null;
    this._step = { kind: 'waiting', provider };

    posthog.capture('account_claim_started', { provider, surface: 'hero' });

    void this._settle(provider, handle);
  }

  public focusPopup(): void {
    this._handle?.focus();
  }

  public cancel(): void {
    const handle = this._handle;

    this._handle = null;
    handle?.cancel();

    if (this._step.kind === 'waiting') {
      this._step = { kind: 'intro' };
    }
  }

  public resume(): void {
    if (this._step.kind === 'busy') {
      this._step = { kind: 'intro' };
    }
  }

  public finishOnboarding(): void {
    this._openDashboard();
  }

  private async _settle(
    provider: OAuthProvider,
    handle: OAuthPopupHandle,
  ): Promise<void> {
    const outcome = await this._outcomeOf(handle);

    if (this._handle !== handle) {
      return;
    }

    this._handle = null;

    await match(outcome)
      .with({ kind: 'signed-in' }, () => this._signedIn())
      .with({ kind: 'failed' }, ({ reason }) => this._fail(reason))
      .with({ kind: 'blocked' }, () => this._redirect(provider))
      .with({ kind: 'cancelled' }, () => {
        this._step = { kind: 'intro' };
      })
      .exhaustive();
  }

  private async _outcomeOf(
    handle: OAuthPopupHandle,
  ): Promise<OAuthPopupOutcome> {
    try {
      return await handle.outcome;
    } catch (error) {
      logger.error('The sign in window failed', error);

      return { kind: 'failed', reason: 'login-failed' };
    }
  }

  private async _signedIn(): Promise<void> {
    const { user, token } = await this._readSession();

    if (token) {
      anonymousPreviewState.adoptSessionToken(token);
    }

    if (user && needsOnboarding(user)) {
      this._step = { kind: 'onboarding', user };
      return;
    }

    this._openDashboard();
  }

  private async _readSession(): Promise<SessionProbe> {
    try {
      return await sessionService.probeSession();
    } catch (error) {
      logger.error('Failed to read the signed in session', error);

      return { user: null };
    }
  }

  private _fail(reason: OAuthFailureReason): void {
    this._error =
      reason === 'project-limit' ? PROJECT_LIMIT_MESSAGE : FAILED_MESSAGE;
    this._step = { kind: 'intro' };
  }

  private async _redirect(provider: OAuthProvider): Promise<void> {
    const preview = anonymousPreviewState.preview;

    if (!preview) {
      this._fail('login-failed');
      return;
    }

    this._step = {
      kind: 'busy',
      label: `Taking you to ${providerName(provider)}`,
    };

    try {
      await startOAuthLogin({
        provider,
        flow: 'claim',
        next_url: `/app/clusters/${preview.clusterId}/${preview.projectId}/monitoring?claimed=1`,
      });
      anonymousPreviewState.handOffPreview();
    } catch (error) {
      logger.error('Failed to start the sign in redirect', error);
      this._fail('login-failed');
    }
  }

  private _openDashboard(): void {
    const preview = anonymousPreviewState.preview;

    this._step = { kind: 'busy', label: 'Opening your dashboard' };
    anonymousPreviewState.handOffPreview();

    window.location.assign(
      preview
        ? resolve(
            `/app/clusters/${preview.clusterId}/${preview.projectId}/monitoring?claimed=1`,
          )
        : resolve('/app/clusters'),
    );
  }
}

export function providerName(provider: OAuthProvider): string {
  return match(provider)
    .with('github', () => 'GitHub')
    .with('google', () => 'Google')
    .exhaustive();
}

export const heroClaim = new HeroClaimState();
