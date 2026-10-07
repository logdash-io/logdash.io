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

  if (pathname.startsWith('/ingest')) {
    // Determine target hostname based on static or dynamic ingestion
    const hostname = pathname.startsWith('/ingest/static/')
      ? 'eu-assets.i.posthog.com'
      : 'eu.i.posthog.com';

    // Build external URL
    const url = new URL(event.request.url);
    url.protocol = 'https:';
    url.hostname = hostname;
    url.port = '443';
    url.pathname = pathname.replace('/ingest/', '');

    // Clone and adjust headers
    const headers = new Headers(event.request.headers);
    headers.set('Accept-Encoding', '');
    headers.set('host', hostname);
    // the proxy is same-origin, so the browser attaches our first-party
    // credentials - they must never reach the analytics vendor
    headers.delete('cookie');
    headers.delete('authorization');

    const init: RequestInit & { duplex: 'half' } = {
      method: event.request.method,
      headers,
      body: event.request.body,
      duplex: 'half',
    };

    // Proxy the request to the external host
    const response = await fetch(url.toString(), init);

    // and it must not be able to set cookies on our origin either
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('set-cookie');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
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
