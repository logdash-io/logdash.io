import { resolve } from '$app/paths';
import { page } from '$app/state';
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
import {
  claimFailureMessage,
  type OAuthFailureReason,
} from '$lib/domains/auth/domain/oauth-popup-message';
import {
  oauthProviderName,
  type OAuthProvider,
} from '$lib/domains/auth/domain/oauth-provider';
import { needsOnboarding } from '$lib/domains/onboarding/application/needs-onboarding';
import { createLogger } from '$lib/domains/shared/logger';
import {
  PAYMENT_PLANS,
  trialTier,
} from '$lib/domains/shared/payment-plans.const';
import type { UserTier } from '$lib/domains/shared/types';
import { match } from 'ts-pattern';

export type HeroClaimStep =
  | { kind: 'intro' }
  | { kind: 'waiting'; provider: OAuthProvider }
  | { kind: 'onboarding' }
  | { kind: 'busy'; label: string };

const logger = createLogger('hero-claim.state', false);

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

  public get trialTier(): UserTier | undefined {
    return trialTier(page.url.searchParams.get('tier'));
  }

  public get trialName(): string | undefined {
    const tier = this.trialTier;

    return PAYMENT_PLANS.find((plan) => plan.tier === tier)?.name;
  }

  public get closable(): boolean {
    return this._step.kind !== 'busy';
  }

  public nudge(key: string): void {
    if (this._nudged.has(key)) {
      return;
    }

    this._nudged.add(key);
    this.show();
  }

  public show(): void {
    if (this._open || !this.eligible) {
      return;
    }

    this._open = true;
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

    const handle = startOAuthPopup({
      provider,
      flow: 'claim',
      tier: this.trialTier,
    });

    this._handle = handle;
    this._error = null;
    this._step = { kind: 'waiting', provider };

    window.logdash?.track('account_claim_started');

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
      this._step = { kind: 'onboarding' };
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
    this._error = claimFailureMessage(reason);
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
      label: `Taking you to ${oauthProviderName(provider)}`,
    };

    try {
      await startOAuthLogin({
        provider,
        flow: 'claim',
        tier: this.trialTier,
        next_url: `/app/domains/${preview.clusterId}/uptime?claimed=1`,
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

    if (!preview) {
      window.location.assign(resolve('/app/domains'));
      return;
    }

    window.location.assign(
      resolve(`/app/domains/${preview.clusterId}/uptime?claimed=1`),
    );
  }
}

export const heroClaim = new HeroClaimState();
