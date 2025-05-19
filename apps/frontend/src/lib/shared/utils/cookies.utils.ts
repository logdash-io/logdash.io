import type { Cookies } from '@sveltejs/kit';
import type { UserTier } from '../types.js';

export const PROJECT_ID_COOKIE_NAME = 'logdash_project_id';
export const API_KEY_COOKIE_NAME = 'logdash_api_key';
export const ACCESS_TOKEN_COOKIE_NAME = 'logdash_access_token';

export const get_api_key = (cookies: Cookies): string | undefined => {
	return cookies.get('logdash_api_key');
};

export const save_project_id = (cookies: Cookies, project_id: string): void => {
	cookies.set('logdash_project_id', project_id, {
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
	});
};

export const get_project_id = (cookies: Cookies): string | undefined => {
	return cookies.get('logdash_project_id');
};

export const save_access_token = (
	cookies: Cookies,
	access_token: string,
	options?: {
		maxAge?: number;
	},
): void => {
	cookies.set('logdash_access_token', access_token, {
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
		...options,
	});
};

export const get_access_token = (cookies: Cookies): string | undefined => {
	return cookies.get('logdash_access_token');
};

export const save_onboarding_tier = (
	cookies: Cookies,
	tier: UserTier,
): void => {
	cookies.set('logdash_onboarding_tier', tier, {
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
	});
};

export const get_onboarding_tier = (cookies: Cookies): UserTier | undefined => {
	return cookies.get('logdash_onboarding_tier') as UserTier;
};

export const clear_onboarding_tier = (cookies: Cookies): void => {
	cookies.delete('logdash_onboarding_tier', {
		path: '/',
	});
};
