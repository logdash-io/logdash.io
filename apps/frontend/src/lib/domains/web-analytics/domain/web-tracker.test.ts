import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../../../../../static/sdk/web.js', import.meta.url),
  'utf8',
);
const siteId = '0123456789abcdef01234567';
type Event = {
  id: string;
  timestamp: string;
  name: string;
  path: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  clickId: string;
  timezone: string;
  userId?: string;
  props?: Record<string, string>;
};
type Batch = { siteId: string; sentAt: string; events: Event[] };
type Api = {
  track: (name: string, props?: unknown) => void;
  identify: (id: unknown) => Promise<void>;
  optOut: () => void;
  optIn: () => void;
  stop: () => void;
};

for (const [origin, domain] of [
  ['https://www.shop.example.com', '.example.com'],
  ['https://www.example.co.uk', '.example.co.uk'],
  ['http://localhost:4173', 'localhost'],
]) {
  test(`sets no cookies or storage and expires legacy ${domain} cookies on ${origin}`, async ({
    page,
    context,
  }) => {
    const { hostname, protocol } = new URL(origin);
    await context.addCookies([
      ...[domain, hostname].flatMap((cookieDomain) =>
        ['ldv_', 'lds_'].map((prefix) => ({
          name: prefix + siteId,
          value: 'legacy',
          domain: cookieDomain,
          path: '/',
          secure: protocol === 'https:',
          sameSite: 'Lax' as const,
        })),
      ),
      { name: 'theme', value: 'dark', domain: hostname, path: '/' },
    ]);
    const batches = await install(page, { origin });
    await page.goto(`${origin}/`);
    await expect.poll(() => batches.length).toBe(1);
    await call(page, 'track', 'signup_completed');
    await page.evaluate(() => history.pushState({}, '', '/pricing'));
    await expect.poll(() => events(batches).length).toBe(3);
    expect((await context.cookies()).map((cookie) => cookie.name)).toEqual([
      'theme',
    ]);
    const writes = await page.evaluate(
      () => (window as unknown as { cookieWrites: string[] }).cookieWrites,
    );
    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes)
      expect(write).toMatch(
        new RegExp(`^ld[vs]_${siteId}=; Path=/; Max-Age=0(; Domain=[^;]+)?$`),
      );
    expect(
      await page.evaluate(() => [localStorage.length, sessionStorage.length]),
    ).toEqual([0, 0]);
    for (const event of events(batches))
      expect(Object.keys(event).sort()).toEqual([
        'clickId',
        'id',
        'name',
        'path',
        'referrer',
        'timestamp',
        'timezone',
        'utmCampaign',
        'utmMedium',
        'utmSource',
        'utmTerm',
      ]);
  });
}

test('sends the attribution of the page load on every event of that page load', async ({
  page,
}) => {
  const batches = await install(page);
  await page.goto(
    'https://app.example/?fbclid=secret-facebook&gclid=secret-google&utm_source=ads',
    { referer: 'https://news.example/item?id=secret' },
  );
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => {
    history.pushState({}, '', '/pricing');
    (window as unknown as { logdash: Api }).logdash.track('signup_started');
    window.dispatchEvent(new Event('pagehide'));
  });
  await expect.poll(() => events(batches).length).toBe(4);
  expect(
    events(batches).map((event) => [
      event.name,
      event.path,
      event.referrer,
      event.utmSource,
      event.clickId,
    ]),
  ).toEqual([
    ['pageview', '/', 'news.example', 'ads', 'gclid'],
    ['pageview', '/pricing', 'news.example', 'ads', 'gclid'],
    ['signup_started', '/pricing', 'news.example', 'ads', 'gclid'],
    ['pageleave', '/pricing', 'news.example', 'ads', 'gclid'],
  ]);
  expect(JSON.stringify(batches)).not.toContain('secret');
  await page.goto('https://app.example/signup');
  await expect.poll(() => named(batches, 'pageview').length).toBe(3);
  expect(named(batches, 'pageview')[2]).toMatchObject({
    path: '/signup',
    referrer: '',
    utmSource: '',
    clickId: '',
  });
});

test('keeps UTM values with any characters, trimmed to 100, and drops emails and control characters', async ({
  page,
}) => {
  const batches = await install(page);
  await page.goto(
    'https://app.example/?utm_source=spring%2Bsale&utm_medium=a%2Fb&utm_campaign=%C3%BCber&utm_term=alice%40example.com',
  );
  await expect.poll(() => batches.length).toBe(1);
  expect(batches[0].events[0]).toMatchObject({
    utmSource: 'spring+sale',
    utmMedium: 'a/b',
    utmCampaign: 'über',
    utmTerm: '',
  });
  await page.goto(
    `https://app.example/next?utm_source=${'x'.repeat(150)}&utm_medium=%20%20email%20%20&utm_campaign=line%0Abreak`,
  );
  await expect.poll(() => named(batches, 'pageview').length).toBe(2);
  expect(named(batches, 'pageview')[1]).toMatchObject({
    utmSource: 'x'.repeat(100),
    utmMedium: 'email',
    utmCampaign: '',
  });
  await page.goto(
    `https://app.example/emoji?utm_source=${'x'.repeat(99)}%F0%9F%98%80tail`,
  );
  await expect.poll(() => named(batches, 'pageview').length).toBe(3);
  expect(named(batches, 'pageview')[2].utmSource).toBe(`${'x'.repeat(99)}😀`);
  const wide = encodeURIComponent('漢'.repeat(100));
  await page.goto(
    `https://app.example/wide?utm_source=${wide}&utm_medium=${wide}&utm_campaign=${wide}&utm_term=${wide}`,
  );
  await expect.poll(() => named(batches, 'pageview').length).toBe(4);
  expect(named(batches, 'pageview')[3].utmCampaign).toBe('漢'.repeat(33));
  await page.evaluate(() => history.pushState({}, '', '/wide/next'));
  await expect.poll(() => named(batches, 'pageview').length).toBe(5);
  expect(named(batches, 'pageview')[4].utmCampaign).toBe('漢'.repeat(33));
});

test('sends a page leave on page hide and a fresh pageview after a back-forward cache restore', async ({
  page,
}) => {
  const batches = await install(page);
  await page.goto('https://app.example/pricing');
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('pagehide'));
    history.replaceState({}, '', '/pricing');
  });
  await expect.poll(() => batches.length).toBe(2);
  expect(batches[1].events).toEqual([
    expect.objectContaining({ name: 'pageleave', path: '/pricing' }),
  ]);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true }),
    ),
  );
  await expect.poll(() => batches.length).toBe(3);
  expect(batches[2].events).toEqual([
    expect.objectContaining({ name: 'pageview', path: '/pricing' }),
  ]);
});

test('tracks SPA navigation once per path and ignores invalid event names', async ({
  page,
}) => {
  const batches = await install(page);
  await page.goto('https://app.example/');
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => {
    history.pushState({}, '', '/pricing?email=alice@example.com#secret');
    history.replaceState({}, '', '/pricing?token=secret');
    history.pushState({}, '', '/signup');
    const api = (window as unknown as { logdash: Api }).logdash;
    api.track('signup_completed');
    api.track('alice@example.com');
  });
  await expect.poll(() => events(batches).length).toBe(4);
  expect(events(batches).map((event) => [event.name, event.path])).toEqual([
    ['pageview', '/'],
    ['pageview', '/pricing'],
    ['pageview', '/signup'],
    ['signup_completed', '/signup'],
  ]);
  await page.goBack();
  await expect.poll(() => events(batches).length).toBe(5);
  expect(batches.at(-1)?.events[0].path).toBe('/pricing');
  expect(JSON.stringify(batches)).not.toContain('alice');
  expect(
    await page.evaluate(() =>
      Object.keys((window as unknown as { logdash: Api }).logdash),
    ),
  ).toEqual(['track', 'identify', 'optOut', 'optIn', 'stop']);
});

test('sends custom event props as strings within the limits and warns once when it drops invalid ones', async ({
  page,
}) => {
  await page.clock.install();
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  const batches = await install(page);
  await page.goto('https://app.example/');
  await page.evaluate(() => {
    const api = (window as unknown as { logdash: Api }).logdash;
    api.track('start', {
      mode: 'zen',
      scale: 2,
      stream: true,
      padded: '  tv  ',
      long: 'x'.repeat(150),
      emoji: `${'x'.repeat(99)}😀tail`,
      blank: '   ',
      missing: null,
      skipped: undefined,
    });
    api.track('plain');
    api.track('bad_keys', {
      Mode: 'zen',
      ['k'.repeat(41)]: 'too long',
      '1st': 'digit',
      ok: 'yes',
    });
    api.track('private_values', {
      email: 'alice@example.com',
      line: 'line\nbreak',
      ok: 'yes',
    });
    api.track('not_scalars', {
      list: ['zen'],
      nested: { mode: 'zen' },
      fn: () => 'zen',
      nan: NaN,
      infinite: Infinity,
      ok: 'yes',
    });
    api.track(
      'eleven_keys',
      Object.fromEntries(
        Array.from({ length: 11 }, (_, index) => [`k${index}`, index]),
      ),
    );
    api.track('not_an_object', 'mode=zen');
    api.track('array', ['zen']);
    api.track('pageview', { mode: 'zen' });
  });
  await page.clock.runFor(1100);
  await expect.poll(() => events(batches).length).toBe(10);
  expect(
    events(batches).map((event) => [event.name, event.props ?? null]),
  ).toEqual([
    ['pageview', null],
    [
      'start',
      {
        mode: 'zen',
        scale: '2',
        stream: 'true',
        padded: 'tv',
        long: 'x'.repeat(100),
        emoji: `${'x'.repeat(99)}😀`,
      },
    ],
    ['plain', null],
    ['bad_keys', { ok: 'yes' }],
    ['private_values', { ok: 'yes' }],
    ['not_scalars', { ok: 'yes' }],
    [
      'eleven_keys',
      Object.fromEntries(
        Array.from({ length: 10 }, (_, index) => [`k${index}`, `${index}`]),
      ),
    ],
    ['not_an_object', null],
    ['array', null],
    ['pageview', null],
  ]);
  expect(named(batches, 'plain')[0]).not.toHaveProperty('props');
  expect(JSON.stringify(batches)).not.toContain('alice');
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain('Invalid props were dropped');
});

test('splits events with full props into batches of at most 32 KB and 20 events', async ({
  page,
}) => {
  await page.clock.install();
  const sizes: number[] = [];
  const batches = await install(page, { sizes });
  await page.goto('https://app.example/');
  await page.evaluate(() => {
    const api = (window as unknown as { logdash: Api }).logdash;
    const props = Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [
        `k${index}${'x'.repeat(38)}`,
        '漢'.repeat(100),
      ]),
    );
    for (let index = 0; index < 40; index++) api.track('full_props', props);
    for (let index = 0; index < 30; index++) api.track('no_props');
  });
  await expect
    .poll(async () => {
      await page.clock.runFor(5100);
      return events(batches).length;
    })
    .toBe(71);
  expect(named(batches, 'full_props')).toHaveLength(40);
  expect(
    named(batches, 'full_props').every(
      (event) => Object.keys(event.props ?? {}).length === 10,
    ),
  ).toBe(true);
  expect(Math.max(...sizes)).toBeLessThanOrEqual(32 * 1024);
  expect(Math.max(...sizes)).toBeGreaterThan(28 * 1024);
  expect(batches.every((batch) => batch.events.length <= 20)).toBe(true);
  expect(batches.at(-1)?.events.length).toBeGreaterThan(1);
});

test('hashes the identified user id in the browser and back-fills queued events', async ({
  page,
}) => {
  await page.clock.install();
  const batches = await install(page);
  await page.goto('https://app.example/');
  await call(page, 'identify', 'user-42');
  await call(page, 'track', 'signed_in');
  await page.clock.runFor(1100);
  await expect.poll(() => batches.length).toBe(1);
  expect(batches[0].events.map((event) => [event.name, event.userId])).toEqual([
    ['pageview', hash('user-42')],
    ['signed_in', hash('user-42')],
  ]);
  expect(JSON.stringify(batches)).not.toContain('user-42');
  await call(page, 'identify', 42);
  await call(page, 'track', 'numeric_id');
  await page.clock.runFor(1100);
  await expect.poll(() => batches.length).toBe(2);
  expect(batches[1].events[0].userId).toBe(hash('42'));
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);
});

test('clears the identity on identify(null) and ignores emails, long and non-scalar ids with a warning', async ({
  page,
}) => {
  await page.clock.install();
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  const batches = await install(page);
  await page.goto('https://app.example/');
  await call(page, 'identify', 'user-1');
  await call(page, 'identify', 'alice@example.com');
  await call(page, 'identify', 'x'.repeat(257));
  await call(page, 'identify', { id: 1 });
  await call(page, 'track', 'still_user_one');
  await expect.poll(() => warnings.length).toBe(3);
  await page.clock.runFor(1100);
  await expect.poll(() => batches.length).toBe(1);
  await call(page, 'identify', '   ');
  await call(page, 'track', 'blank_cleared');
  await page.clock.runFor(1100);
  await expect.poll(() => batches.length).toBe(2);
  await call(page, 'identify', 'user-1');
  await call(page, 'identify', null);
  await call(page, 'track', 'signed_out');
  await page.evaluate(() => {
    const api = (window as unknown as { logdash: Api }).logdash;
    void api.identify('user-2');
    return api.identify(undefined);
  });
  await call(page, 'track', 'still_anonymous');
  await page.clock.runFor(1100);
  await expect.poll(() => batches.length).toBe(3);
  expect(events(batches).map((event) => [event.name, event.userId])).toEqual([
    ['pageview', hash('user-1')],
    ['still_user_one', hash('user-1')],
    ['blank_cleared', undefined],
    ['signed_out', undefined],
    ['still_anonymous', undefined],
  ]);
  expect(JSON.stringify(batches)).not.toContain('alice');
});

test('opts out across page loads and opts back in with a fresh pageview', async ({
  page,
}) => {
  const batches = await install(page);
  await page.goto('https://app.example/');
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => {
    const api = (window as unknown as { logdash: Api }).logdash;
    api.track('pending_event');
    api.optOut();
    api.track('after_opt_out');
    history.pushState({}, '', '/after-opt-out');
  });
  expect(
    await page.evaluate(() => [
      localStorage.getItem('logdash:opt-out'),
      history.pushState.toString().includes('[native code]'),
    ]),
  ).toEqual(['1', true]);
  await page.reload();
  await page.evaluate(() => history.pushState({}, '', '/still-out'));
  await call(page, 'optIn');
  expect(
    await page.evaluate(() => localStorage.getItem('logdash:opt-out')),
  ).toBeNull();
  await expect.poll(() => batches.length).toBe(2);
  expect(batches[1].events.map((event) => [event.name, event.path])).toEqual([
    ['pageview', '/still-out'],
  ]);
  await call(page, 'optIn');
  await page.evaluate(() => history.pushState({}, '', '/back-in'));
  await expect.poll(() => batches.length).toBe(3);
  expect(events(batches).map((event) => [event.name, event.path])).toEqual([
    ['pageview', '/'],
    ['pageview', '/still-out'],
    ['pageview', '/back-in'],
  ]);
});

test('stops a page restored from the back-forward cache after an opt-out elsewhere', async ({
  page,
}) => {
  await page.clock.install();
  const batches = await install(page);
  await page.goto('https://app.example/pricing');
  await page.clock.runFor(1100);
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => {
    localStorage.setItem('logdash:opt-out', '1');
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true }),
    );
    (window as unknown as { logdash: Api }).logdash.track('after_opt_out');
  });
  expect(
    await page.evaluate(() =>
      history.pushState.toString().includes('[native code]'),
    ),
  ).toBe(true);
  await page.clock.runFor(6000);
  expect(batches).toHaveLength(1);
});

test('keeps stop() as an alias of optOut() and restarts on the same page with optIn()', async ({
  page,
}) => {
  const batches = await install(page);
  await page.goto('https://app.example/');
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => {
    const api = (window as unknown as { logdash: Api }).logdash;
    api.track('pending_event');
    api.stop();
  });
  expect(
    await page.evaluate(() => localStorage.getItem('logdash:opt-out')),
  ).toBe('1');
  await call(page, 'optIn');
  await page.evaluate(() => history.pushState({}, '', '/again'));
  await expect.poll(() => events(batches).length).toBe(3);
  expect(events(batches).map((event) => [event.name, event.path])).toEqual([
    ['pageview', '/'],
    ['pageview', '/'],
    ['pageview', '/again'],
  ]);
});

test('honors privacy signals and still expires legacy cookies', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: `ldv_${siteId}`,
      value: 'legacy',
      domain: '.app.example',
      path: '/',
    },
  ]);
  const batches = await install(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true });
  });
  await page.goto('https://app.example/');
  expect(await page.evaluate(() => 'logdash' in window)).toBe(false);
  expect(await context.cookies()).toEqual([]);
  expect(batches).toEqual([]);
});

test('ignores automated browsers', async ({ page }) => {
  const batches = await install(page, { automated: true });
  await page.goto('https://app.example/');
  expect(await page.evaluate(() => navigator.webdriver)).toBe(true);
  expect(await page.evaluate(() => 'logdash' in window)).toBe(false);
  expect(batches).toEqual([]);
});

test('retries temporary ingestion failures using the same event id', async ({
  page,
}) => {
  const batches = await install(page, { failFirst: true });
  await page.goto('https://app.example/');
  await expect.poll(() => batches.length, { timeout: 10000 }).toBe(2);
  expect(batches[1].events).toEqual(batches[0].events);
  expect(Date.parse(batches[1].sentAt)).toBeGreaterThan(
    Date.parse(batches[0].sentAt),
  );
});

test('sends fresh events when an expired batch is at the front of the queue', async ({
  page,
}) => {
  await page.clock.install();
  const batches = await install(page);
  await page.goto('https://app.example/');
  await page.evaluate(() => {
    const api = (window as unknown as { logdash: Api }).logdash;
    for (let index = 0; index < 20; index++) api.track('old_event');
  });
  await page.clock.setSystemTime(new Date(Date.now() + 5 * 60000));
  await call(page, 'track', 'fresh_event');
  await page.clock.runFor(1100);
  await expect.poll(() => batches.length).toBe(1);
  expect(batches[0].events.map((event) => event.name)).toEqual(['fresh_event']);
});

test('flushes all pending batches when the page is hidden', async ({
  page,
}) => {
  const batches = await install(page);
  await page.goto('https://app.example/');
  await page.evaluate(() => {
    const api = (window as unknown as { logdash: Api }).logdash;
    for (let index = 0; index < 60; index++) api.track('queued_event');
    window.dispatchEvent(new Event('pagehide'));
  });
  await expect.poll(() => events(batches).length).toBe(62);
  expect(batches.every((batch) => batch.events.length <= 20)).toBe(true);
  expect(
    batches.every(
      (batch) => Math.abs(Date.parse(batch.sentAt) - Date.now()) < 60000,
    ),
  ).toBe(true);
});

test('flushes new events on page hide while an earlier request is in flight', async ({
  page,
}) => {
  let finish: () => void = () => undefined;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const batches = await install(page, { holdFirst: pending });
  try {
    await page.goto('https://app.example/');
    await expect.poll(() => batches.length).toBe(1);
    await page.evaluate(() => {
      (window as unknown as { logdash: Api }).logdash.track('late_event');
      window.dispatchEvent(new Event('pagehide'));
    });
    await expect.poll(() => batches.length).toBe(2);
    expect(batches[1].events.map((event) => event.name)).toEqual([
      'late_event',
      'pageleave',
    ]);
  } finally {
    finish();
  }
});

test.describe('from a cross-origin endpoint', () => {
  test.use({ timezoneId: 'Europe/Warsaw' });

  test('sends plain-text batches with the time zone and keyword so no preflight is needed', async ({
    page,
  }) => {
    const types: string[] = [];
    const batches: Batch[] = [];
    await page.route('https://api.example/web_events', async (route) => {
      types.push(route.request().headers()['content-type']);
      batches.push(route.request().postDataJSON() as Batch);
      await route.fulfill({
        status: 202,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: '',
      });
    });
    await install(page, { endpoint: 'https://api.example/web_events' });
    await page.goto(
      'https://app.example/?utm_source=google&utm_term=log+monitoring',
    );
    await expect.poll(() => batches.length).toBe(1);
    expect(types[0]).toContain('text/plain');
    expect(batches[0].events[0].timezone).toBe('Europe/Warsaw');
    expect(batches[0].events[0].utmTerm).toBe('log monitoring');
  });
});

async function install(
  page: Page,
  {
    failFirst = false,
    holdFirst,
    endpoint = '/_ld/events',
    origin = 'https://app.example',
    automated = false,
    sizes = [],
  }: {
    failFirst?: boolean;
    holdFirst?: Promise<void>;
    endpoint?: string;
    origin?: string;
    automated?: boolean;
    sizes?: number[];
  } = {},
): Promise<Batch[]> {
  const batches: Batch[] = [];
  if (!automated)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { value: false });
    });
  await page.addInitScript(() => {
    const cookie = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'cookie',
    );
    const writes: string[] = [];
    Object.defineProperty(window, 'cookieWrites', { value: writes });
    Object.defineProperty(document, 'cookie', {
      get: (): unknown => cookie?.get?.call(document),
      set: (value: string): void => {
        writes.push(value);
        cookie?.set?.call(document, value);
      },
    });
  });
  await page.route(`${origin}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/_ld/script.js') {
      await route.fulfill({
        contentType: 'application/javascript',
        body: source,
      });
      return;
    }
    if (url.pathname === '/_ld/events') {
      sizes.push(route.request().postDataBuffer()?.length ?? 0);
      batches.push(route.request().postDataJSON() as Batch);
      const first = batches.length === 1;
      if (first && holdFirst) await holdFirst;
      await route.fulfill({
        status: failFirst && first ? 503 : 202,
        body: '',
      });
      return;
    }
    await route.fulfill({
      contentType: 'text/html',
      body: `<html><body><h1>Test app</h1><script defer src="/_ld/script.js" data-site="${siteId}" data-endpoint="${endpoint}"></script></body></html>`,
    });
  });
  return batches;
}

function events(batches: Batch[]): Event[] {
  return batches.flatMap((batch) => batch.events);
}

function named(batches: Batch[], name: string): Event[] {
  return events(batches).filter((event) => event.name === name);
}

function hash(id: string): string {
  return createHash('sha256').update(`${siteId}:${id}`).digest('hex');
}

async function call(
  page: Page,
  method: keyof Api,
  argument?: unknown,
): Promise<void> {
  await page.evaluate(
    ([method, argument]) =>
      (
        window as unknown as {
          logdash: Record<string, (argument: unknown) => unknown>;
        }
      ).logdash[method](argument),
    [method, argument] as const,
  );
}
