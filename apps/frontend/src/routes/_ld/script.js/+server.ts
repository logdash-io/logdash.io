import { trackerScriptResponse } from '$lib/domains/site-analytics/infrastructure/first-party-proxy';
import tracker from '../../../../static/sdk/web.js?raw';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => trackerScriptResponse(tracker);
