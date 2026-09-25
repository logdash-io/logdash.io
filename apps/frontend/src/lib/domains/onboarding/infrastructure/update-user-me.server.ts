import { envConfig } from '$lib/domains/shared/utils/env-config';

export const updateUserMe = async (dto: {
  token: string;
  path: 'consents' | 'onboarding';
  body: unknown;
}): Promise<Response> =>
  fetch(`${envConfig.apiBaseUrl}/users/me/${dto.path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${dto.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(dto.body),
  });
