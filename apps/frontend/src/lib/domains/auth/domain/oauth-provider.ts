import { match } from 'ts-pattern';

export type OAuthProvider = 'github' | 'google';

export function oauthProviderName(provider: OAuthProvider): string {
  return match(provider)
    .with('github', () => 'GitHub')
    .with('google', () => 'Google')
    .exhaustive();
}
