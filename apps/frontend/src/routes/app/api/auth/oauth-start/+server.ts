import { dev } from '$app/environment';
import { UserTier } from '$lib/domains/shared/types.js';
import { generateGithubOAuthUrl } from '$lib/domains/shared/utils/generate-github-oauth-url';
import { generateGoogleOAuthUrl } from '$lib/domains/shared/utils/generate-google-oauth-url';
import { isLocal } from '$lib/domains/shared/utils/is-dev.util';
import { save_oauth_state } from '$lib/domains/shared/utils/oauth-state.server';
import { safe_redirect_path } from '$lib/domains/shared/utils/safe-redirect.util';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SUPPORTED_PROVIDERS = ['github', 'google'] as const;
const SUPPORTED_FLOWS = ['login', 'claim'] as const;

type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];
type SupportedFlow = (typeof SUPPORTED_FLOWS)[number];

type OAuthStartBody = {
  provider?: string;
  terms_accepted?: boolean;
  email_accepted?: boolean;
  tier?: string;
  next_url?: string;
  flow?: string;
};

const google_redirect_uri = (origin: string): string =>
  isLocal() || dev
    ? 'http://localhost:5173/app/callbacks/oauth/google-alternative'
    : `${origin}/app/callbacks/oauth/google`;

export const POST: RequestHandler = async ({ request, cookies, url }) => {
  const body = (await request.json().catch(() => ({}))) as OAuthStartBody;
  const provider = body.provider as SupportedProvider;

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return json({ error: 'Unsupported provider' }, { status: 400 });
  }

  const state = crypto.randomUUID();

  save_oauth_state(cookies, {
    state,
    terms_accepted: body.terms_accepted === true,
    email_accepted: body.email_accepted === true,
    next_url: safe_redirect_path(body.next_url, '/app/clusters'),
    flow: SUPPORTED_FLOWS.includes(body.flow as SupportedFlow)
      ? (body.flow as SupportedFlow)
      : 'login',
    ...(Object.values(UserTier).includes(body.tier as UserTier) && {
      tier: body.tier as UserTier,
    }),
  });

  return json({
    url:
      provider === 'github'
        ? generateGithubOAuthUrl(state)
        : generateGoogleOAuthUrl(state, {
            redirectUri: google_redirect_uri(url.origin),
          }),
  });
};
