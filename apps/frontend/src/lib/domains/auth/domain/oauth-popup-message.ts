export const OAUTH_POPUP_CHANNEL = 'logdash-auth';

const OAUTH_POPUP_MESSAGE_TYPE = 'logdash-oauth';

export const OAUTH_FAILURE_REASONS = [
  'project-limit',
  'unavailable',
  'claim-failed',
  'login-failed',
] as const;

export type OAuthFailureReason = (typeof OAUTH_FAILURE_REASONS)[number];

export const claimFailureMessage = (reason: OAuthFailureReason): string =>
  reason === 'project-limit'
    ? 'That account has reached its service limit. Free a slot there, then try again.'
    : 'Signing in did not go through. Your dashboard is untouched. Try again.';

export type OAuthPopupMessage =
  | { type: typeof OAUTH_POPUP_MESSAGE_TYPE; status: 'ok'; reason: null }
  | {
      type: typeof OAUTH_POPUP_MESSAGE_TYPE;
      status: 'error';
      reason: OAuthFailureReason;
    };

export const createOAuthPopupMessage = (
  status: unknown,
  reason: unknown,
): OAuthPopupMessage =>
  status === 'ok'
    ? { type: OAUTH_POPUP_MESSAGE_TYPE, status: 'ok', reason: null }
    : {
        type: OAUTH_POPUP_MESSAGE_TYPE,
        status: 'error',
        reason:
          OAUTH_FAILURE_REASONS.find((known) => known === reason) ??
          'login-failed',
      };

export const parseOAuthPopupMessage = (
  data: unknown,
): OAuthPopupMessage | null => {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const { type, status, reason } = data as Record<string, unknown>;

  if (type !== OAUTH_POPUP_MESSAGE_TYPE) {
    return null;
  }

  return createOAuthPopupMessage(status, reason);
};
