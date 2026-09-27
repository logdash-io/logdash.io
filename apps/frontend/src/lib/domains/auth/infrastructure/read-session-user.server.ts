import type { User } from '$lib/domains/shared/user/domain/user';
import { envConfig } from '$lib/domains/shared/utils/env-config';

export type SessionUserResult =
  | { kind: 'ok'; user: User }
  | { kind: 'unauthorized' }
  | { kind: 'not-found' }
  | { kind: 'unavailable' };

export const readSessionUser = async (
  token: string,
): Promise<SessionUserResult> => {
  try {
    const response = await fetch(`${envConfig.apiBaseUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      return { kind: 'unauthorized' };
    }

    if (response.status === 404) {
      return { kind: 'not-found' };
    }

    if (!response.ok) {
      return { kind: 'unavailable' };
    }

    const user = (await response.json()) as User;

    if (!user?.id) {
      return { kind: 'unavailable' };
    }

    return { kind: 'ok', user };
  } catch {
    return { kind: 'unavailable' };
  }
};
