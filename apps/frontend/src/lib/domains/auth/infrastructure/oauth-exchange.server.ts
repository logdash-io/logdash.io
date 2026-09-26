import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
import { envConfig } from '$lib/domains/shared/utils/env-config';
import { match } from 'ts-pattern';

export class OAuthExchangeError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.name = 'OAuthExchangeError';
    this.status = status;
  }
}

export const loginWithOAuth = async (
  provider: OAuthProvider,
  code: string,
): Promise<{ token: string }> =>
  exchangeCode(`/auth/${provider}/login`, {
    [providerCodeField(provider)]: code,
  });

export const claimAccount = async (
  provider: OAuthProvider,
  dto: { code: string; accessToken: string },
): Promise<{ token: string }> =>
  exchangeCode(`/auth/${provider}/claim`, {
    [providerCodeField(provider)]: dto.code,
    accessToken: dto.accessToken,
  });

const exchangeCode = async (
  path: string,
  body: Record<string, string>,
): Promise<{ token: string }> => {
  const response = await fetch(`${envConfig.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new OAuthExchangeError(
      response.status,
      await readErrorMessage(response),
    );
  }

  const { token } = (await response.json().catch(() => ({}))) as {
    token?: string;
  };

  if (!token) {
    throw new OAuthExchangeError(
      response.status,
      `${path} response did not contain a token`,
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
