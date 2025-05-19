import {
	ACCESS_TOKEN_COOKIE_NAME,
	API_KEY_COOKIE_NAME,
	PROJECT_ID_COOKIE_NAME,
} from '$lib/shared/utils/cookies.utils';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete(PROJECT_ID_COOKIE_NAME, {
		path: '/',
	});
	cookies.delete(API_KEY_COOKIE_NAME, {
		path: '/',
	});
	cookies.delete(ACCESS_TOKEN_COOKIE_NAME, {
		path: '/',
	});

	redirect(302, '/');
};
