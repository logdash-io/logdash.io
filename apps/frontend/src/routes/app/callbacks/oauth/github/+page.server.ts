import { dev } from '$app/environment';
import { bffLogger } from '$lib/domains/shared/bff-logger';
import { logdashAPI } from '$lib/domains/shared/logdash.api';
import {
	get_access_token,
	save_access_token,
	save_onboarding_tier,
} from '$lib/domains/shared/utils/cookies.utils';
import type { GithubCallbackState } from '$lib/domains/shared/utils/generate-github-oauth-url';
import {
	isRedirect,
	redirect,
	type Cookies,
	type ServerLoadEvent,
} from '@sveltejs/kit';

async function runLoginFlow(dto: {
	cookies: Cookies;
	code: string | null;
	state: GithubCallbackState;
}) {
	const {
		code,
		cookies,
		state: { terms_accepted, email_accepted },
	} = dto;

	bffLogger.info(`logging in github ${dto.code}...`);

	const { error, access_token } = await logdashAPI.github_login({
		code,
		terms_accepted,
		email_accepted,
		is_local_env: dev,
	});

	if (error) {
		throw new Error(`github login error: ${error}`);
	}

	bffLogger.info(`github login success: ${access_token}`);
	const expiration = new Date(
		JSON.parse(atob(access_token.split('.')[1])).exp * 1000,
	);

	save_access_token(cookies, access_token, {
		maxAge: expiration.getTime() - Date.now(),
	});

	redirect(302, `/app/clusters`);
}

async function runClaimFlow(dto: {
	cookies: Cookies;
	code: string | null;
	state: GithubCallbackState;
}) {
	const {
		code,
		cookies,
		state: { cluster_id, terms_accepted, email_accepted, next_url },
	} = dto;

	if (!cluster_id) {
		throw new Error('cluster_id is required for claiming');
	}

	const anon_access_token = get_access_token(cookies);

	bffLogger.info(`claiming github ${JSON.stringify({ code })}...`);

	const { error, access_token } = await logdashAPI.claim_account({
		github_code: code,
		anon_jwt_token: anon_access_token,
		terms_accepted,
		email_accepted,
		is_local_env: dev,
	});

	if (error) {
		throw new Error(`github claim error: ${error}`);
	}

	const expiration = new Date(
		JSON.parse(atob(access_token.split('.')[1])).exp * 1000,
	);

	save_access_token(cookies, access_token, {
		maxAge: expiration.getTime() - Date.now(),
	});

	redirect(302, next_url || `/app/clusters`);
}

export const load = async ({
	url,
	cookies,
}: ServerLoadEvent): Promise<void> => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	bffLogger.debug(`github oauth callback ${JSON.stringify({ code, state })}`);

	const decodedState: GithubCallbackState = JSON.parse(atob(state));

	if (decodedState.tier) {
		save_onboarding_tier(cookies, decodedState.tier);
	}

	try {
		if (decodedState.flow === 'login') {
			await runLoginFlow({
				cookies,
				code,
				state: decodedState,
			});
		} else if (decodedState.flow === 'claim') {
			await runClaimFlow({
				cookies,
				code,
				state: decodedState,
			});
		}
	} catch (result) {
		if (isRedirect(result)) {
			throw result;
		}

		bffLogger.error(`github oauth callback error ${result}`);
		redirect(302, decodedState.fallback_url || '/');
	}
};
