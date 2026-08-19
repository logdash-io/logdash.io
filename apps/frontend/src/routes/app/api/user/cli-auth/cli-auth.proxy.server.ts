import { envConfig } from '$lib/domains/shared/utils/env-config';
import { json } from '@sveltejs/kit';

/**
 * Thin pass-through to the backend CLI-auth endpoints that preserves the upstream
 * status code. The consent screen has to tell "that code is wrong" (404), "that
 * request was already used" (410) and "you have tried too many codes" (429) apart,
 * so collapsing everything into a generic 500 is not good enough here.
 */
export async function proxyCliAuth(
  path: 'lookup' | 'approve' | 'deny',
  accessToken: string,
  body: unknown,
): Promise<Response> {
  const response = await fetch(`${envConfig.apiBaseUrl}/auth/cli/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  return json(payload, { status: response.status });
}
