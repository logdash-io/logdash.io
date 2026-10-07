import { bffLogger } from '$lib/domains/shared/bff-logger.server';
import { proxyWebEvents } from '$lib/domains/site-analytics/infrastructure/first-party-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const response = await proxyWebEvents(request, getClientAddress());

  if (response.status === 429 || response.status >= 500) {
    bffLogger().warn(`web events proxy answered ${response.status}`);
    bffLogger().mutateMetric('webEventsProxyFailures', 1);
  }

  return response;
};
