import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { RequestHandler } from './$types';
import { proxyCliAuth } from '../cli-auth.proxy.server';

export const POST: RequestHandler = async ({ cookies, request }) => {
  const body = await request.json();

  return proxyCliAuth('lookup', get_access_token(cookies), body);
};
