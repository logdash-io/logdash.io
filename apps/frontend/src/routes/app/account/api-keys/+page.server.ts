import { readSessionUser } from '$lib/domains/auth/infrastructure/read-session-user.server';
import {
  needsOnboarding,
  onboardingUrl,
} from '$lib/domains/onboarding/application/needs-onboarding';
import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';
import type { PersonalApiKey } from '$lib/domains/app/personal-api-keys/domain/personal-api-key.js';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (
  event: ServerLoadEvent,
): Promise<{ apiKeys: PersonalApiKey[] }> => {
  const accessToken = get_access_token(event.cookies);

  if (!accessToken) {
    redirect(302, '/app/auth');
  }

  const [session, apiKeys] = await Promise.all([
    readSessionUser(accessToken),
    logdashAPI.get_personal_api_keys(accessToken) as Promise<PersonalApiKey[]>,
  ]);

  if (session.kind === 'ok' && needsOnboarding(session.user)) {
    redirect(302, onboardingUrl(event.url.pathname));
  }

  return { apiKeys };
};
