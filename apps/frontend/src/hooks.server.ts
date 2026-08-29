import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

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

    // Proxy the request to the external host
    const response = await fetch(url.toString(), {
      method: event.request.method,
      headers,
      body: event.request.body,
      // duplex isn't supported by sveltekit fetch, but we need it here
      duplex: 'half',
    } as unknown);

    // and it must not be able to set cookies on our origin either
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('set-cookie');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }

  const response = await resolve(event);
  return response;
};
