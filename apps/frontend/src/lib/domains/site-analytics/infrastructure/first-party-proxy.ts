import { neutralPath, SITE_ANALYTICS_ID } from '../domain/site-analytics';

const EVENTS_URL = 'https://api.logdash.io/web_events';
const MAX_BODY_BYTES = 32 * 1024;
const MAX_BATCH_EVENTS = 20;
const FORWARDED_HEADERS = ['origin', 'user-agent'];

type Batch = Record<string, unknown> & {
  events: Record<string, unknown>[];
};

export function trackerScriptResponse(source: string): Response {
  return new Response(source, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

export async function proxyWebEvents(
  request: Request,
  clientAddress: string,
): Promise<Response> {
  const mediaType = request.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  if (mediaType !== 'application/json') {
    return reply(415);
  }

  const body = await readCapped(request, MAX_BODY_BYTES);
  if (body === null) {
    return reply(413);
  }

  const batch = parseBatch(body);
  if (!batch) {
    return reply(400);
  }

  const headers = new Headers({ 'content-type': 'application/json' });
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  if (clientAddress) {
    headers.set('x-logdash-client-ip', clientAddress);
  }

  try {
    const upstream = await fetch(EVENTS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'text/plain',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return reply(502);
  }
}

function parseBatch(body: string): Batch | null {
  let batch: unknown;
  try {
    batch = JSON.parse(body);
  } catch {
    return null;
  }

  if (
    !isRecord(batch) ||
    batch.siteId !== SITE_ANALYTICS_ID ||
    !Array.isArray(batch.events) ||
    batch.events.length === 0 ||
    batch.events.length > MAX_BATCH_EVENTS ||
    !batch.events.every(isRecord)
  ) {
    return null;
  }

  return {
    ...batch,
    events: batch.events.map((event) =>
      typeof event.path === 'string'
        ? { ...event, path: neutralPath(event.path) }
        : event,
    ),
  };
}

async function readCapped(
  request: Request,
  limit: number,
): Promise<string | null> {
  if (Number(request.headers.get('content-length')) > limit) {
    return null;
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return '';
  }

  const decoder = new TextDecoder();
  let text = '';
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return text + decoder.decode();
    }

    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }

    text += decoder.decode(value, { stream: true });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function reply(status: number): Response {
  return new Response(null, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}
