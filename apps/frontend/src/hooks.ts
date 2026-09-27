import { markdownRoute } from '$lib/landing/seo/markdown-twin';
import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = ({ url }) => markdownRoute(url.pathname);
