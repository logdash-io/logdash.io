import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
import {
  OAUTH_POPUP_CHANNEL,
  createOAuthPopupMessage,
  parseOAuthPopupMessage,
  type OAuthFailureReason,
  type OAuthPopupMessage,
} from '$lib/domains/auth/domain/oauth-popup-message';
import { requestOAuthUrl } from '$lib/domains/auth/infrastructure/request-oauth-url';

export type OAuthPopupOutcome =
  | { kind: 'signed-in' }
  | { kind: 'failed'; reason: OAuthFailureReason }
  | { kind: 'blocked' }
  | { kind: 'cancelled' };

export type OAuthPopupHandle = {
  outcome: Promise<OAuthPopupOutcome>;
  focus: () => void;
  cancel: () => void;
};

const POPUP_NAME = 'logdash-oauth';
const POPUP_MARKER_KEY = 'logdash-oauth-popup';
const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 680;

export function startOAuthPopup(dto: {
  provider: OAuthProvider;
  flow: 'login' | 'claim';
  prepare?: () => Promise<void>;
}): OAuthPopupHandle {
  const popup = window.open('', POPUP_NAME, popupFeatures());

  if (!popup) {
    return {
      outcome: Promise.resolve({ kind: 'blocked' }),
      focus: () => {},
      cancel: () => {},
    };
  }

  writePopupMarker(popup, true);

  const channel = new BroadcastChannel(OAUTH_POPUP_CHANNEL);
  const { promise: outcome, resolve } =
    Promise.withResolvers<OAuthPopupOutcome>();
  let settled = false;

  const settle = (result: OAuthPopupOutcome): void => {
    if (settled) {
      return;
    }

    settled = true;
    channel.close();
    resolve(result);
  };

  channel.onmessage = (event: MessageEvent<unknown>): void => {
    const message = parseOAuthPopupMessage(event.data);

    if (!message) {
      return;
    }

    settle(
      message.status === 'ok'
        ? { kind: 'signed-in' }
        : { kind: 'failed', reason: message.reason },
    );
  };

  const openProvider = async (): Promise<void> => {
    try {
      await dto.prepare?.();

      const url = await requestOAuthUrl({
        provider: dto.provider,
        flow: dto.flow,
        popup: true,
      });

      if (settled) {
        return;
      }

      if (popup.closed) {
        settle({ kind: 'cancelled' });

        return;
      }

      popup.location.replace(url);
    } catch {
      popup.close();
      settle({ kind: 'failed', reason: 'unavailable' });
    }
  };

  void openProvider();

  return {
    outcome,
    focus: () => popup.focus(),
    cancel: () => {
      popup.close();
      settle({ kind: 'cancelled' });
    },
  };
}

export function reportOAuthPopupResult(message: OAuthPopupMessage): void {
  const channel = new BroadcastChannel(OAUTH_POPUP_CHANNEL);

  channel.postMessage(message);
  channel.close();
  writePopupMarker(window, false);
  window.name = '';
  window.close();
}

export function reportOAuthPopupFailure(reason: unknown): void {
  if (isOAuthPopupWindow()) {
    reportOAuthPopupResult(createOAuthPopupMessage('error', reason));
  }
}

function isOAuthPopupWindow(): boolean {
  try {
    return (
      window.name === POPUP_NAME ||
      window.sessionStorage.getItem(POPUP_MARKER_KEY) === POPUP_NAME
    );
  } catch {
    return window.name === POPUP_NAME;
  }
}

function writePopupMarker(target: Window, marked: boolean): void {
  try {
    if (marked) {
      target.sessionStorage.setItem(POPUP_MARKER_KEY, POPUP_NAME);
    } else {
      target.sessionStorage.removeItem(POPUP_MARKER_KEY);
    }
  } catch {
    return;
  }
}

function popupFeatures(): string {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

  return [
    'popup=yes',
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
  ].join(',');
}
