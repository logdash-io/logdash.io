import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_PATH,
  API_KEY_COOKIE_NAME,
  PROJECT_ID_COOKIE_NAME,
} from '$lib/domains/shared/utils/cookies.utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete(PROJECT_ID_COOKIE_NAME, {
    path: '/',
  });
  cookies.delete(API_KEY_COOKIE_NAME, {
    path: '/',
  });
  cookies.delete(ACCESS_TOKEN_COOKIE_NAME, {
    path: ACCESS_TOKEN_COOKIE_PATH,
  });
  // sessions issued before the token cookie was scoped to /app
  cookies.delete(ACCESS_TOKEN_COOKIE_NAME, {
    path: '/',
  });

  return new Response(null, { status: 204 });
};
