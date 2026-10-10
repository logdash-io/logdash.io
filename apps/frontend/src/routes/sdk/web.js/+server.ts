import { trackerScriptResponse } from '$lib/domains/site-analytics/infrastructure/first-party-proxy';
import tracker from '$lib/domains/web-analytics/domain/web-tracker.js?minify';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => trackerScriptResponse(tracker);
