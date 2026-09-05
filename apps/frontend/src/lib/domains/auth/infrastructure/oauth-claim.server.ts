import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
import { envConfig } from '$lib/domains/shared/utils/env-config';
import { match } from 'ts-pattern';

export type ClaimAccountDto = {
  code: string;
  accessToken: string;
  termsAccepted: boolean;
  emailAccepted: boolean;
};

export class ClaimAccountError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.name = 'ClaimAccountError';
    this.status = status;
  }
}

export const claimAccount = async (
  provider: OAuthProvider,
  dto: ClaimAccountDto,
): Promise<{ token: string }> => {
  const response = await fetch(
    `${envConfig.apiBaseUrl}/auth/${provider}/claim`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        [providerCodeField(provider)]: dto.code,
        accessToken: dto.accessToken,
        termsAccepted: dto.termsAccepted,
        emailAccepted: dto.emailAccepted,
      }),
    },
  );

  if (!response.ok) {
    throw new ClaimAccountError(
      response.status,
      await readErrorMessage(response),
    );
  }

  const { token } = (await response.json().catch(() => ({}))) as {
    token?: string;
  };

  if (!token) {
    throw new ClaimAccountError(
      response.status,
      'Claim response did not contain a token',
    );
  }

  return { token };
};

const providerCodeField = (provider: OAuthProvider): string =>
  match(provider)
    .with('github', () => 'githubCode')
    .with('google', () => 'googleCode')
    .exhaustive();

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: unknown };

    if (typeof body?.message === 'string') {
      return body.message;
    }

    return JSON.stringify(body);
  } catch {
    return response.statusText;
  }
};
