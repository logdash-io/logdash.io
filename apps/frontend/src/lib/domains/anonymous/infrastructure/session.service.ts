import type { User } from '$lib/domains/shared/user/domain/user';

const SESSION_ENDPOINT = '/app/api/auth/session';

export type SessionProbe = {
  user: User | null;
  token?: string;
};

export class SessionService {
  public async probeSession(): Promise<SessionProbe> {
    const response = await fetch(SESSION_ENDPOINT, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return { user: null };
    }

    return (await response.json()) as SessionProbe;
  }

  public async installSession(token: string): Promise<void> {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error(`Failed to install the session (${response.status})`);
    }
  }
}

export const sessionService = new SessionService();
