import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ cookies, params }) => {
  await logdashAPI.revoke_personal_api_key(
    get_access_token(cookies),
    params.id,
  );

  return json({ success: true });
};
