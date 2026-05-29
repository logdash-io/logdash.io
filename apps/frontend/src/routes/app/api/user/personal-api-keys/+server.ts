import { logdashAPI } from '$lib/domains/shared/logdash.api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
  const data = await logdashAPI.get_personal_api_keys(
    get_access_token(cookies),
  );

  return json(data);
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  const body = await request.json();

  const data = await logdashAPI.create_personal_api_key(
    get_access_token(cookies),
    body,
  );

  return json(data);
};
