import {
  assertLogdashApiKey,
  bffLogger,
  flushBffLogger,
} from '$lib/domains/shared/bff-logger.server';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const SECURITY_HEADERS = {
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export const init: ServerInit = assertLogdashApiKey;

export const handleError: HandleServerError = ({ error, event, status }) => {
  if (status < 500) {
    return;
  }

  bffLogger().error(
    `unhandled error on ${event.route.id ?? 'an unknown route'}: ${error instanceof Error ? error.message : String(error)}`,
  );
  bffLogger().mutateMetric('unhandledErrors', 1);
  event.platform?.ctx?.waitUntil(flushBffLogger());
};

const flushLogs: Handle = async ({ event, resolve }) => {
  try {
    return await resolve(event);
  } finally {
    event.platform?.ctx?.waitUntil(flushBffLogger());
  }
};

const routeRequest: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/app' || pathname === '/app/') {
    return new Response(null, {
      status: 308,
      headers: { location: `/app/domains${event.url.search}` },
    });
  }

  if (pathname === '/app/clusters' || pathname.startsWith('/app/clusters/')) {
    return new Response(null, {
      status: 308,
      headers: {
        location: `${pathname.replace('/app/clusters', '/app/domains')}${event.url.search}`,
      },
    });
  }

  const response = await resolve(event, {
    preload: ({ type, path }) =>
      type === 'js' ||
      type === 'css' ||
      (type === 'font' && path.includes('inter-latin-opsz-normal')),
  });

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(name)) {
      response.headers.set(name, value);
    }
  }

  return response;
};

export const handle = sequence(flushLogs, routeRequest);
