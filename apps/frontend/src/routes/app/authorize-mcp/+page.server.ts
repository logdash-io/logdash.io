import {
  fail,
  redirect,
  type ActionFailure,
  type ServerLoadEvent,
} from '@sveltejs/kit';
import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import {
  needsOnboarding,
  onboardingUrl,
} from '$lib/domains/onboarding/application/needs-onboarding';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { envConfig } from '$lib/domains/shared/utils/env-config';
import type { RequestEvent } from './$types';

type Consent = {
  consentId: string;
  clientName: string;
  redirectHost: string;
  scopes: string[];
  expiresAt: string;
};

type SessionEvent = Pick<RequestEvent, 'cookies' | 'url'>;

const INVALID_REQUEST =
  'This authorization request is invalid or has expired. Start again from your coding agent.';

async function requireAccessToken(event: SessionEvent): Promise<string> {
  const nextUrl = `${event.url.pathname}${event.url.search}`;
  const accessToken = get_access_token(event.cookies);

  if (!accessToken) {
    redirect(302, `/app/auth?next_url=${encodeURIComponent(nextUrl)}`);
  }

  const session = await readSessionUser(accessToken);

  if (session.kind === 'unauthorized' || session.kind === 'not-found') {
    redirect(302, `/app/auth?next_url=${encodeURIComponent(nextUrl)}`);
  }

  if (session.kind === 'ok' && needsOnboarding(session.user)) {
    redirect(302, onboardingUrl(nextUrl));
  }

  return accessToken;
}

export const load = async (
  event: ServerLoadEvent,
): Promise<{ consent: Consent | null; error: string | null }> => {
  const accessToken = await requireAccessToken(event);

  try {
    const response = await fetch(
      `${envConfig.apiBaseUrl}/oauth/authorize/details`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(Object.fromEntries(event.url.searchParams)),
      },
    );

    if (!response.ok) {
      return { consent: null, error: INVALID_REQUEST };
    }

    return { consent: (await response.json()) as Consent, error: null };
  } catch {
    return {
      consent: null,
      error: 'We could not reach Logdash. Try again in a moment.',
    };
  }
};

async function proxyConsent(
  event: RequestEvent,
  path: 'approve' | 'deny',
): Promise<ActionFailure<{ error: string }>> {
  const accessToken = await requireAccessToken(event);
  const form = await event.request.formData();
  const consentId = form.get('consentId');

  if (typeof consentId !== 'string') {
    return fail(400, { error: INVALID_REQUEST });
  }

  const response = await fetch(
    `${envConfig.apiBaseUrl}/oauth/authorize/${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ consentId }),
    },
  );

  if (!response.ok) {
    return fail(response.status, { error: INVALID_REQUEST });
  }

  const payload = (await response.json()) as { redirectUrl: string };

  redirect(303, payload.redirectUrl);
}

export const actions = {
  approve: async (event: RequestEvent) => proxyConsent(event, 'approve'),
  deny: async (event: RequestEvent) => proxyConsent(event, 'deny'),
};
