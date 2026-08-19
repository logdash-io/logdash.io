/**
 * What the backend tells us about a pending `ld login` request once the user has
 * typed the code from their terminal. The code is never taken from the URL — see
 * ADR-0003 invariant #3.
 */
export type CliAuthRequest = {
  userCode: string;
  clientIp: string;
  clientUserAgent: string;
  requestedAt: string;
  expiresAt: string;
};

/** Human-readable reason a user code did not resolve, by upstream status. */
export function cliAuthErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "That doesn't look like a valid code. It has the form XXXX-XXXX.";
    case 404:
      return 'No pending request matches that code. Check your terminal and try again.';
    case 410:
      return 'That request was already approved or denied. Start a new one from your terminal.';
    case 429:
      return 'Too many attempts. Wait a few minutes before trying another code.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
