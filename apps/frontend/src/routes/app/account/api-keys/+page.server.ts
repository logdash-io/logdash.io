import { logdashAPI } from '$lib/domains/shared/logdash.api.server.js';
import type { PersonalApiKey } from '$lib/domains/app/personal-api-keys/domain/personal-api-key.js';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (
  event: ServerLoadEvent,
): Promise<{ apiKeys: PersonalApiKey[] }> => {
  const accessToken = get_access_token(event.cookies);

  if (!accessToken) {
    throw redirect(302, '/app/auth');
  }

  const apiKeys = (await logdashAPI.get_personal_api_keys(
    accessToken,
  )) as PersonalApiKey[];

  return { apiKeys };
};
