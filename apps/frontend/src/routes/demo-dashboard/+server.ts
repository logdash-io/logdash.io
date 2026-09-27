import { HERO_ID } from '$lib/landing/hero/hero-anchors';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** The live demo is the home page hero now; old links land there. */
export const GET: RequestHandler = () => {
  redirect(301, `/#${HERO_ID}`);
};
