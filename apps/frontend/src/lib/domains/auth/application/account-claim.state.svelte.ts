import { sessionService } from '$lib/domains/anonymous/infrastructure/session.service';
import {
  startOAuthPopup,
  type OAuthPopupHandle,
  type OAuthPopupOutcome,
} from '$lib/domains/auth/application/start-oauth-popup';
import { startOAuthLogin } from '$lib/domains/auth/application/start-oauth-login';
import { claimFailureMessage } from '$lib/domains/auth/domain/oauth-popup-message';
import {
  oauthProviderName,
  type OAuthProvider,
} from '$lib/domains/auth/domain/oauth-provider';
import { needsOnboarding } from '$lib/domains/onboarding/application/needs-onboarding';
import { createLogger } from '$lib/domains/shared/logger';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
import { match } from 'ts-pattern';

export type AccountClaimStep =
  | { kind: 'idle' }
  | { kind: 'waiting'; provider: OAuthProvider }
  | { kind: 'consent' }
  | { kind: 'busy'; label: string };

const logger = createLogger('account-claim.state', false);

const ERROR_TOAST_MS = 8_000;

class AccountClaimState {
  private _step = $state.raw<AccountClaimStep>({ kind: 'idle' });
  private _handle: OAuthPopupHandle | null = null;
  private _nextUrl = '';

  public get step(): AccountClaimStep {
    return this._step;
  }

  public start(provider: OAuthProvider, nextUrl: string): void {
    if (this._step.kind !== 'idle') {
      return;
    }

    const handle = startOAuthPopup({ provider, flow: 'claim' });

    this._handle = handle;
    this._nextUrl = nextUrl;
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
      this._step = { kind: 'idle' };
    }
  }

  public resume(): void {
    if (this._step.kind === 'busy') {
      this._step = { kind: 'idle' };
    }
  }

  public finishConsent(): void {
    this._open();
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
      .with({ kind: 'failed' }, ({ reason }) => {
        toast.error(claimFailureMessage(reason), ERROR_TOAST_MS);
        this._step = { kind: 'idle' };
      })
      .with({ kind: 'blocked' }, () => this._redirect(provider))
      .with({ kind: 'cancelled' }, () => {
        this._step = { kind: 'idle' };
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
    this._step = { kind: 'busy', label: 'Saving your dashboard' };

    try {
      const { user } = await sessionService.probeSession();

      if (user && needsOnboarding(user)) {
        this._step = { kind: 'consent' };
        return;
      }
    } catch (error) {
      logger.error('Failed to read the signed in session', error);
    }

    this._open();
  }

  private async _redirect(provider: OAuthProvider): Promise<void> {
    this._step = {
      kind: 'busy',
      label: `Taking you to ${oauthProviderName(provider)}`,
    };

    try {
      await startOAuthLogin({
        provider,
        flow: 'claim',
        next_url: this._nextUrl,
      });
    } catch (error) {
      logger.error('Failed to start the sign in redirect', error);
      toast.error(claimFailureMessage('login-failed'), ERROR_TOAST_MS);
      this._step = { kind: 'idle' };
    }
  }

  private _open(): void {
    this._step = { kind: 'busy', label: 'Saving your dashboard' };
    window.location.assign(this._nextUrl);
  }
}

export const accountClaim = new AccountClaimState();
