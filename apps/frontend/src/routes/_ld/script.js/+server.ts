import { proxyTrackerScript } from '$lib/domains/site-analytics/infrastructure/first-party-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => proxyTrackerScript();
