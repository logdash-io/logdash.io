import { expect, test } from '@playwright/test';
import { SITE_ANALYTICS_ID } from '../domain/site-analytics';
import { proxyWebEvents, trackerScriptResponse } from './first-party-proxy';

type Call = { url: string; init?: RequestInit };
type SentBatch = { sentAt: string; events: { path: string }[] };

function stubFetch(response: () => Response): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (input, init) => {
    calls.push({ url: input as string, init });
    return Promise.resolve(response());
  };
  return calls;
}

function eventsRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request('https://logdash.io/_ld/events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://logdash.io',
      'user-agent': 'Mozilla/5.0 Test',
      cookie: 'session=secret',
      authorization: 'Bearer secret',
      'x-logdash-client-ip': '6.6.6.6',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const event = (path: string): { name: string; path: string } => ({
  name: 'pageview',
  path,
});
const CLIENT_IP = '203.0.113.7';

test('forwards a batch to the fixed upstream with neutral paths, Origin, User-Agent and the real client IP', async () => {
  const calls = stubFetch(() => new Response(null, { status: 202 }));
  const response = await proxyWebEvents(
    eventsRequest({
      siteId: SITE_ANALYTICS_ID,
      sentAt: '2026-10-06T00:00:00.000Z',
      events: [
        event(
          '/app/domains/0123456789abcdef01234567/89abcdef0123456789abcdef/metrics',
        ),
        event('/for/acme.com/shop'),
        event('/pricing'),
      ],
    }),
    CLIENT_IP,
  );

  expect(response.status).toBe(202);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe('https://api.logdash.io/web_events');
  const headers = new Headers(calls[0].init?.headers);
  expect([...headers.keys()].sort()).toEqual([
    'content-type',
    'origin',
    'user-agent',
    'x-logdash-client-ip',
  ]);
  expect(headers.get('origin')).toBe('https://logdash.io');
  expect(headers.get('user-agent')).toBe('Mozilla/5.0 Test');
  expect(headers.get('x-logdash-client-ip')).toBe(CLIENT_IP);
  const sent = JSON.parse(calls[0].init?.body as string) as SentBatch;
  expect(sent.sentAt).toBe('2026-10-06T00:00:00.000Z');
  expect(
    sent.events.map((sentEvent: { path: string }) => sentEvent.path),
  ).toEqual(['/app/domains/[id]/[id]/metrics', '/for/[address]', '/pricing']);
});

test('preserves upstream errors and rejects bad requests without calling upstream', async () => {
  stubFetch(() => new Response('limit', { status: 429 }));
  const limited = await proxyWebEvents(
    eventsRequest({ siteId: SITE_ANALYTICS_ID, events: [event('/')] }),
    CLIENT_IP,
  );
  expect(limited.status).toBe(429);
  expect(await limited.text()).toBe('limit');

  const calls = stubFetch(() => new Response(null, { status: 202 }));
  const badRequests = [
    eventsRequest(
      { siteId: SITE_ANALYTICS_ID, events: [event('/')] },
      { 'content-type': 'text/plain' },
    ),
    eventsRequest({
      siteId: SITE_ANALYTICS_ID,
      events: [event('/'.repeat(33 * 1024))],
    }),
    eventsRequest({
      siteId: SITE_ANALYTICS_ID,
      events: Array.from({ length: 21 }, () => event('/')),
    }),
    eventsRequest({
      siteId: '0123456789abcdef01234567',
      events: [event('/')],
    }),
    eventsRequest('{'),
  ];
  const rejected = await Promise.all(
    badRequests.map((request) => proxyWebEvents(request, CLIENT_IP)),
  );
  expect(rejected.map((response) => response.status)).toEqual([
    415, 413, 400, 400, 400,
  ]);
  expect(calls).toHaveLength(0);
});

test('serves the bundled tracker as cached JavaScript without a network call', async () => {
  const calls = stubFetch(() => new Response(null, { status: 500 }));
  const script = trackerScriptResponse('(function(){})()');
  expect(calls).toHaveLength(0);
  expect(script.status).toBe(200);
  expect(script.headers.get('content-type')).toBe(
    'application/javascript; charset=utf-8',
  );
  expect(script.headers.get('cache-control')).toBe('public, max-age=3600');
  expect(await script.text()).toBe('(function(){})()');
});
