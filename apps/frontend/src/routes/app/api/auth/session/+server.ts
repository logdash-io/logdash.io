import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_PATH,
  get_access_token,
  save_access_token,
} from '$lib/domains/shared/utils/cookies.utils';
import { decodeJwtPayload } from '$lib/domains/shared/utils/jwt.utils';
import { json, type Cookies } from '@sveltejs/kit';
import { match } from 'ts-pattern';
import type { RequestHandler } from './$types';

const SAME_SITE_FETCH_SITES = ['same-origin', 'none'];

export const GET: RequestHandler = async ({ cookies }) => {
  const token = get_access_token(cookies);

  if (!token) {
    return json({ user: null });
  }

  const result = await readSessionUser(token);

  return match(result)
    .with({ kind: 'ok' }, ({ user }) => json({ user, token }))
    .with({ kind: 'unauthorized' }, { kind: 'not-found' }, () => {
      clearAccessToken(cookies);

      return json({ user: null });
    })
    .with({ kind: 'unavailable' }, () =>
      json({ user: null, unavailable: true }),
    )
    .exhaustive();
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  const fetchSite = request.headers.get('sec-fetch-site') ?? '';

  if (!SAME_SITE_FETCH_SITES.includes(fetchSite)) {
    return json(
      { error: 'Cross site requests are not allowed' },
      { status: 403 },
    );
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'Json body is required' }, { status: 415 });
  }

  const body = await readJsonBody(request);
  const token = body?.token;

  if (typeof token !== 'string' || token.length === 0) {
    return json({ error: 'Token is required' }, { status: 400 });
  }

  const maxAge = tokenMaxAge(token);

  if (!maxAge) {
    return json({ error: 'Token is expired or malformed' }, { status: 400 });
  }

  const result = await readSessionUser(token);

  if (result.kind === 'unavailable') {
    return json({ error: 'Session check is unavailable' }, { status: 503 });
  }

  if (result.kind !== 'ok') {
    return json({ error: 'Token is not valid' }, { status: 401 });
  }

  if (result.user.accountClaimStatus !== 'anonymous') {
    return json(
      { error: 'Only anonymous sessions can be installed this way' },
      { status: 403 },
    );
  }

  const installedToken = get_access_token(cookies);

  if (installedToken && installedToken !== token) {
    const installed = await readSessionUser(installedToken);

    if (installed.kind === 'unavailable') {
      return json({ error: 'Session check is unavailable' }, { status: 503 });
    }

    if (
      installed.kind === 'ok' &&
      installed.user.accountClaimStatus !== 'anonymous'
    ) {
      return json(
        { error: 'A claimed session is already installed' },
        { status: 409 },
      );
    }
  }

  save_access_token(cookies, token, { maxAge });

  return json({ user: result.user });
};

const readJsonBody = async (
  request: Request,
): Promise<{ token?: unknown } | null> => {
  try {
    return (await request.json()) as { token?: unknown };
  } catch {
    return null;
  }
};

const tokenMaxAge = (token: string): number | null => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return null;
  }

  const maxAge = payload.exp - Math.floor(Date.now() / 1000);

  return maxAge > 0 ? maxAge : null;
};

const clearAccessToken = (cookies: Cookies): void => {
  cookies.delete(ACCESS_TOKEN_COOKIE_NAME, {
    path: ACCESS_TOKEN_COOKIE_PATH,
  });
};
