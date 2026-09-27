import { HERO_URL_INPUT_ID } from '$lib/landing/hero/hero-anchors';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  redirect(308, `/#${HERO_URL_INPUT_ID}`);
};
