import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
import type { UserTier } from '$lib/domains/shared/types.js';

export type OAuthStartDto = {
  provider: OAuthProvider;
  flow?: 'login' | 'claim';
  next_url?: string;
  tier?: UserTier;
  popup?: boolean;
};

export const requestOAuthUrl = async (dto: OAuthStartDto): Promise<string> => {
  const response = await fetch('/app/api/auth/oauth-start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error(`Could not start ${dto.provider} login`);
  }

  const { url } = (await response.json()) as { url: string };

  return url;
};
