import { updateUserMe } from '$lib/domains/onboarding/infrastructure/update-user-me.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import { is_same_site_request } from '$lib/domains/shared/utils/same-site-request.util';
import { json, type Cookies } from '@sveltejs/kit';

export const forwardOnboardingUpdate = async <Dto>(dto: {
  request: Request;
  cookies: Cookies;
  path: 'consents' | 'onboarding';
  parse: (body: unknown) => Dto | null;
}): Promise<Response> => {
  const { request, cookies, path, parse } = dto;

  if (!is_same_site_request(request)) {
    return noStoreJson(
      { error: 'Cross site requests are not allowed' },
      { status: 403 },
    );
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return noStoreJson({ error: 'Json body is required' }, { status: 415 });
  }

  const token = get_access_token(cookies);

  if (!token) {
    return noStoreJson({ error: 'Not signed in' }, { status: 401 });
  }

  const body = parse(await request.json().catch(() => null));

  if (!body) {
    return noStoreJson({ error: 'Invalid body' }, { status: 400 });
  }

  const response = await updateUserMe({ token, path, body }).catch(() => null);

  if (!response) {
    return noStoreJson({ error: 'Api is unavailable' }, { status: 503 });
  }

  if (!response.ok) {
    return noStoreJson(
      { error: `Api responded with ${response.status}` },
      { status: response.status },
    );
  }

  return noStoreJson(await response.json());
};

const noStoreJson = (body: unknown, init?: ResponseInit): Response =>
  json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      Vary: 'Cookie',
    },
  });
