import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../../../../../static/sdk/web.js', import.meta.url),
  'utf8',
);
const siteId = '0123456789abcdef01234567';
type Event = {
  id: string;
  visitorId: string;
  sessionId: string;
  name: string;
  path: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  clickId: string;
  timezone: string;
};
type Batch = { siteId: string; sentAt: string; events: Event[] };

test('keeps anonymous visitors across reloads and starts a new session after inactivity', async ({
  page,
  context,
}) => {
  const batches = await install(page);
  await page.goto(
    'https://app.example/?utm_source=newsletter&email=alice@example.com',
  );
  await expect.poll(() => batches.length).toBe(1);
  const first = batches[0].events[0];
  expect(first.name).toBe('pageview');
  expect(first.path).toBe('/');
  expect(first.utmSource).toBe('newsletter');
  expect(JSON.stringify(batches)).not.toContain('alice');
  const cookies = await context.cookies();
  const visitor = cookies.find((cookie) => cookie.name === `ldv_${siteId}`);
  expect(visitor?.sameSite).toBe('Lax');
  expect(visitor?.secure).toBe(true);
  expect(visitor?.expires).toBeGreaterThan(Date.now() / 1000 + 360 * 86400);
  await page.reload();
  await expect.poll(() => named(batches, 'pageview').length).toBe(2);
  expect(named(batches, 'pageview')[1].visitorId).toBe(first.visitorId);
  expect(named(batches, 'pageview')[1].sessionId).toBe(first.sessionId);
  await context.clearCookies({ name: `lds_${siteId}` });
  await page.reload();
  await expect.poll(() => named(batches, 'pageview').length).toBe(3);
  expect(named(batches, 'pageview')[2].visitorId).toBe(first.visitorId);
  expect(named(batches, 'pageview')[2].sessionId).not.toBe(first.sessionId);
});

test('starts a new session 24 hours after the session started even with continuous activity', async ({
  page,
  context,
}) => {
  await page.clock.install();
  const batches = await install(page);
  await page.goto('https://app.example/');
  const startedAt = await page.evaluate(() => Date.now());
  const first = await sessionCookie(context);
  for (let minutes = 20; minutes < 24 * 60; minutes += 20) {
    await page.clock.setSystemTime(startedAt + minutes * 60000);
    await track(page, 'heartbeat');
    expect(await sessionCookie(context)).toBe(first);
  }
  await page.clock.setSystemTime(startedAt + 24 * 3600000);
  await track(page, 'heartbeat');
  const second = await sessionCookie(context);
  expect(second).not.toBe(first);
  await page.clock.runFor(1100);
  await expect
    .poll(() => named(batches, 'heartbeat').at(-1)?.sessionId)
    .toBe(second);
});

test('sends a page leave on page hide only while a session is active', async ({
  page,
  context,
}) => {
  const batches = await install(page);
  await page.goto('https://app.example/pricing');
  await expect.poll(() => batches.length).toBe(1);
  const pageview = batches[0].events[0];
  await page.evaluate(() => {
    window.dispatchEvent(new Event('pagehide'));
    history.replaceState({}, '', '/pricing');
  });
  await expect.poll(() => batches.length).toBe(2);
  expect(batches[1].events).toEqual([
    expect.objectContaining({
      name: 'pageleave',
      path: '/pricing',
      visitorId: pageview.visitorId,
      sessionId: pageview.sessionId,
    }),
  ]);
  await context.clearCookies({ name: `lds_${siteId}` });
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  expect(await sessionCookie(context)).toBeUndefined();
  await page.evaluate(() => history.pushState({}, '', '/signup'));
  await expect.poll(() => batches.length).toBe(3);
  expect(
    batches.flatMap((batch) => batch.events).map((event) => event.name),
  ).toEqual(['pageview', 'pageleave', 'pageview']);
  expect(batches[2].events[0].sessionId).not.toBe(pageview.sessionId);
});

test('keeps the ad click id parameter name, never its value, for the whole session', async ({
  page,
  context,
}) => {
  const batches = await install(page);
  await page.goto(
    'https://app.example/?fbclid=secret-facebook&gclid=secret-google&utm_source=ads',
  );
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => history.pushState({}, '', '/pricing'));
  await expect.poll(() => batches.length).toBe(2);
  await page.goto('https://app.example/signup');
  await expect.poll(() => named(batches, 'pageview').length).toBe(3);
  expect(
    named(batches, 'pageview').map((event) => [event.path, event.clickId]),
  ).toEqual([
    ['/', 'gclid'],
    ['/pricing', 'gclid'],
    ['/signup', 'gclid'],
  ]);
  expect(JSON.stringify(batches)).not.toContain('secret');
  expect(JSON.stringify(await context.cookies())).not.toContain('secret');
});

test('keeps UTM values with any characters, trimmed to 100, and drops emails and control characters', async ({
  page,
  context,
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
  await context.clearCookies({ name: `lds_${siteId}` });
  await page.goto(
    `https://app.example/next?utm_source=${'x'.repeat(150)}&utm_medium=%20%20email%20%20&utm_campaign=line%0Abreak`,
  );
  await expect.poll(() => batches.length).toBe(2);
  expect(batches[1].events[0]).toMatchObject({
    utmSource: 'x'.repeat(100),
    utmMedium: 'email',
    utmCampaign: '',
  });
  await context.clearCookies({ name: `lds_${siteId}` });
  await page.goto(
    `https://app.example/emoji?utm_source=${'x'.repeat(99)}%F0%9F%98%80tail`,
  );
  await expect.poll(() => batches.length).toBe(3);
  expect(batches[2].events[0].utmSource).toBe(`${'x'.repeat(99)}😀`);
  await context.clearCookies({ name: `lds_${siteId}` });
  const wide = encodeURIComponent('漢'.repeat(100));
  await page.goto(
    `https://app.example/wide?utm_source=${wide}&utm_medium=${wide}&utm_campaign=${wide}&utm_term=${wide}`,
  );
  await expect.poll(() => batches.length).toBe(4);
  const wideEvent = batches[3].events[0];
  expect(wideEvent.utmCampaign).toBe('漢'.repeat(33));
  await page.evaluate(() => history.pushState({}, '', '/wide/next'));
  await expect.poll(() => batches.length).toBe(5);
  expect(batches[4].events[0].sessionId).toBe(wideEvent.sessionId);
});

for (const [origin, domain] of [
  ['https://www.shop.example.com', '.example.com'],
  ['https://www.example.co.uk', '.example.co.uk'],
  ['http://localhost:4173', 'localhost'],
]) {
  test(`stores cookies for ${domain} when served from ${origin} and removes them on stop`, async ({
    page,
    context,
  }) => {
    const batches = await install(page, { origin });
    await page.goto(`${origin}/`);
    await expect.poll(() => batches.length).toBe(1);
    expect(
      (await context.cookies())
        .map((cookie) => [cookie.name, cookie.domain])
        .sort(),
    ).toEqual([
      [`lds_${siteId}`, domain],
      [`ldv_${siteId}`, domain],
    ]);
    await page.evaluate(() =>
      (window as unknown as { logdash: { stop: () => void } }).logdash.stop(),
    );
    expect(await context.cookies()).toEqual([]);
  });
}

test('tracks SPA navigation once per path and sends event names without identity or properties', async ({
  page,
}) => {
  const batches = await install(page);
  await page.goto('https://app.example/');
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => {
    history.pushState({}, '', '/pricing?email=alice@example.com#secret');
    history.replaceState({}, '', '/pricing?token=secret');
    history.pushState({}, '', '/signup');
    const api = (
      window as unknown as { logdash: { track: (name: string) => void } }
    ).logdash;
    api.track('signup_completed');
    api.track('alice@example.com');
  });
  await expect
    .poll(() => batches.flatMap((batch) => batch.events).length)
    .toBe(4);
  expect(
    batches
      .flatMap((batch) => batch.events)
      .map((event) => [event.name, event.path]),
  ).toEqual([
    ['pageview', '/'],
    ['pageview', '/pricing'],
    ['pageview', '/signup'],
    ['signup_completed', '/signup'],
  ]);
  await page.goBack();
  await expect
    .poll(() => batches.flatMap((batch) => batch.events).length)
    .toBe(5);
  expect(batches.at(-1)?.events[0].path).toBe('/pricing');
  expect(JSON.stringify(batches)).not.toContain('alice');
  expect(
    await page.evaluate(() =>
      Object.keys((window as unknown as { logdash: object }).logdash),
    ),
  ).toEqual(['track', 'stop']);
});

test('stops tracking and removes cookies when consent is withdrawn', async ({
  page,
  context,
}) => {
  const batches = await install(page);
  await page.goto('https://app.example/');
  await expect.poll(() => batches.length).toBe(1);
  await page.evaluate(() => {
    const api = (
      window as unknown as {
        logdash: { track: (name: string) => void; stop: () => void };
      }
    ).logdash;
    api.track('pending_event');
    api.stop();
    api.track('after_stop');
    history.pushState({}, '', '/after-stop');
  });
  expect(
    (await context.cookies()).filter((cookie) => cookie.name.startsWith('ld')),
  ).toEqual([]);
  await page.reload();
  await expect.poll(() => batches.length).toBe(2);
  expect(
    batches
      .flatMap((batch) => batch.events)
      .every((event) => event.name === 'pageview'),
  ).toBe(true);
});

test('honors privacy signals before creating cookies or sending events', async ({
  page,
  context,
}) => {
  const batches = await install(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true });
  });
  await page.goto('https://app.example/');
  expect(await page.evaluate(() => 'logdash' in window)).toBe(false);
  expect(await context.cookies()).toEqual([]);
  expect(batches).toEqual([]);
});

test('ignores automated browsers before creating cookies or sending events', async ({
  page,
  context,
}) => {
  const batches = await install(page, { automated: true });
  await page.goto('https://app.example/');
  expect(await page.evaluate(() => navigator.webdriver)).toBe(true);
  expect(await page.evaluate(() => 'logdash' in window)).toBe(false);
  expect(await context.cookies()).toEqual([]);
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
    const api = (
      window as unknown as { logdash: { track: (name: string) => void } }
    ).logdash;
    for (let index = 0; index < 20; index++) api.track('old_event');
  });
  await page.clock.setSystemTime(new Date(Date.now() + 5 * 60000));
  await page.evaluate(() => {
    (
      window as unknown as { logdash: { track: (name: string) => void } }
    ).logdash.track('fresh_event');
  });
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
    const api = (
      window as unknown as { logdash: { track: (name: string) => void } }
    ).logdash;
    for (let index = 0; index < 60; index++) api.track('queued_event');
    window.dispatchEvent(new Event('pagehide'));
  });
  await expect
    .poll(() => batches.flatMap((batch) => batch.events).length)
    .toBe(62);
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
      (
        window as unknown as { logdash: { track: (name: string) => void } }
      ).logdash.track('late_event');
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
  }: {
    failFirst?: boolean;
    holdFirst?: Promise<void>;
    endpoint?: string;
    origin?: string;
    automated?: boolean;
  } = {},
): Promise<Batch[]> {
  const batches: Batch[] = [];
  if (!automated)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { value: false });
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

function named(batches: Batch[], name: string): Event[] {
  return batches
    .flatMap((batch) => batch.events)
    .filter((event) => event.name === name);
}

async function track(page: Page, name: string): Promise<void> {
  await page.evaluate(
    (event) =>
      (
        window as unknown as { logdash: { track: (name: string) => void } }
      ).logdash.track(event),
    name,
  );
}

async function sessionCookie(
  context: BrowserContext,
): Promise<string | undefined> {
  const cookie = (await context.cookies()).find(
    (item) => item.name === `lds_${siteId}`,
  );
  return (
    cookie &&
    (JSON.parse(decodeURIComponent(cookie.value)) as { id: string }).id
  );
}
