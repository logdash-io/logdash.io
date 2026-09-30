import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from '@playwright/test';

const ACCESS_TOKEN_COOKIE = 'logdash_access_token_v0';
const PREVIEW_STORAGE_KEY = 'logdash_anonymous_preview_v0';
const MONITORING_PATH = /\/app\/domains\/[^/]+\/[^/]+\/monitoring/;
const CLAIMED_USER = {
  id: '000000000000000000000001',
  tier: 'free',
  accountClaimStatus: 'claimed',
  termsAcceptedAt: null,
  onboardingCompletedAt: null,
};

type StoredPreview = {
  clusterId: string;
  projectId: string;
  monitorId: string;
  url: string;
};

async function readAccessToken(context: BrowserContext): Promise<string> {
  const cookies = await context.cookies();
  const token = cookies.find((cookie) => cookie.name === ACCESS_TOKEN_COOKIE);

  expect(token, `${ACCESS_TOKEN_COOKIE} cookie is missing`).toBeTruthy();

  return token!.value;
}

function userIdFromToken(token: string): string {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
  ) as { id?: string };

  expect(payload.id, 'token carries no user id').toBeTruthy();

  return payload.id!;
}

async function readStoredPreview(page: Page): Promise<StoredPreview | null> {
  return page.evaluate((key) => {
    const raw = sessionStorage.getItem(key);

    if (!raw) {
      return null;
    }

    return (JSON.parse(raw) as { preview: StoredPreview }).preview ?? null;
  }, PREVIEW_STORAGE_KEY);
}

async function startMonitoring(page: Page, url: string): Promise<void> {
  // A click before hydration falls back to a native form GET, so wait for the
  // client to take over before driving the form.
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Your app URL').first().fill(url);
  await page.getByRole('button', { name: 'Start monitoring' }).first().click();
}

function heroTile(page: Page) {
  return page.locator('#hero-showcase').first();
}

function fullScreenFrame(page: Page) {
  return page.locator('#hero-showcase:modal');
}

async function expectFullScreen(
  page: Page,
  host: string,
  cluster = host,
): Promise<void> {
  const frame = fullScreenFrame(page);
  const sidebar = frame.locator('aside[aria-hidden="true"]');

  await expect(frame).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => frame.boundingBox())
    .toEqual({ x: 0, y: 0, ...page.viewportSize()! });
  await expect(page).toHaveTitle(`${host} · Logdash`);
  await expect(
    frame.getByRole('heading', { name: host, exact: true }),
  ).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveText(
    new RegExp(
      `^\\s*All domains\\s*Domains\\s*${cluster[0]}\\s*${cluster}\\s*Home\\s*Status pages\\s*Settings\\s*${host}[\\s\\S]*New service\\s*Anonymous\\s*Free\\s*$`,
    ),
  );
}

function claimCard(page: Page): Locator {
  return fullScreenFrame(page).getByRole('dialog', {
    name: /^Keep watching /,
  });
}

async function expectClaimCard(page: Page, host: string): Promise<void> {
  const card = claimCard(page);

  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(
    card.getByRole('heading', { name: `Keep watching ${host}` }),
  ).toBeVisible();
  await expect(
    card.getByText(new RegExp(`^${host} is up · \\d+ ms$`)),
  ).toBeVisible();
  await expect(card).toBeFocused();
  await expect(
    card.getByRole('button', { name: 'Continue with GitHub' }),
  ).toBeVisible();
  await expect(
    card.getByRole('button', { name: 'Continue with Google' }),
  ).toBeVisible();
}

test.describe('anonymous landing flow', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;
  let landingTitle = '';
  let dashboardPath = '';
  const consoleErrors: string[] = [];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('check 1: the idle landing shows a live monitor tile without console errors', async () => {
    await page.goto('/');

    const tile = heroTile(page);

    await expect(tile).toBeVisible();
    await expect(
      tile.getByText(/Live monitor|Your live monitor/),
    ).toBeVisible();
    await expect(page.getByLabel('Your app URL').first()).toBeVisible();

    // Give client-side hydration and the demo poll a beat to surface errors.
    await page.waitForTimeout(2_000);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('check 2: submitting a URL opens a full-screen live preview and sets the app-scoped token', async () => {
    await page.goto('/');
    landingTitle = await page.title();

    await startMonitoring(page, 'https://example.com');

    const tile = heroTile(page);

    await expect(page).toHaveURL('/for/example.com');
    await expect(tile.getByText('Your live monitor')).toBeVisible({
      timeout: 30_000,
    });
    await expectFullScreen(page, 'example.com');
    await expectClaimCard(page, 'example.com');
    await expect(tile.getByText('Operational', { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    // A response time and a non-zero check count prove a real ping landed.
    await expect(tile.getByText(/^\d+ ms$/)).toBeVisible({ timeout: 30_000 });
    await expect(tile.getByText(/^[1-9]\d*$/).last()).toBeVisible({
      timeout: 30_000,
    });

    const cookies = await context.cookies();
    const token = cookies.find((cookie) => cookie.name === ACCESS_TOKEN_COOKIE);

    expect(token, `${ACCESS_TOKEN_COOKIE} cookie is missing`).toBeTruthy();
    expect(token!.path).toBe('/app');

    const stored = await readStoredPreview(page);

    expect(stored?.url).toBe('https://example.com');
  });

  test('check 2b: Esc closes the claim card, then returns to the site, and Open full screen brings the dashboard back', async () => {
    await page.keyboard.press('Escape');

    await expect(claimCard(page)).toHaveCount(0);
    await expect(fullScreenFrame(page)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(fullScreenFrame(page)).toHaveCount(0);
    await expect(page).toHaveTitle(landingTitle);

    await heroTile(page)
      .getByRole('button', { name: 'Open full screen' })
      .click();

    await expectFullScreen(page, 'example.com');
  });

  test('check 3: reloading the landing restores the full-screen preview from sessionStorage', async () => {
    const before = await readStoredPreview(page);

    await page.reload();

    const tile = heroTile(page);

    await expect(tile.getByText('Your live monitor')).toBeVisible({
      timeout: 30_000,
    });
    await expectFullScreen(page, 'example.com');
    await expectClaimCard(page, 'example.com');

    const after = await readStoredPreview(page);

    expect(after?.monitorId).toBe(before?.monitorId);
    expect(after?.projectId).toBe(before?.projectId);
  });

  test('check 4: opening the dashboard lands on monitoring with a claim banner and no upgrade', async () => {
    const stored = await readStoredPreview(page);

    expect(stored, 'no preview to open').toBeTruthy();

    await claimCard(page).getByRole('button', { name: 'Not now' }).click();
    await expect(claimCard(page)).toHaveCount(0);

    await page
      .getByRole('button', { name: 'Open your dashboard' })
      .first()
      .click();

    await page.waitForURL(MONITORING_PATH, { timeout: 30_000 });

    expect(page.url()).toContain(
      `/app/domains/${stored!.clusterId}/${stored!.projectId}/monitoring`,
    );
    dashboardPath = new URL(page.url()).pathname;

    const claimBanner = page.getByText('Temporary dashboard');

    await expect(claimBanner).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^\d+(?:d \d+h|h \d+m) left$/)).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Claim with GitHub or Google' }),
    ).toBeVisible();

    // The monitor carried over with its pings.
    await expect(page.getByText('example.com').first()).toBeVisible({
      timeout: 30_000,
    });

    // Anonymous users cannot upgrade, so the profile menu offers no upgrade.
    await page
      .getByRole('button', { name: /Anonymous/ })
      .first()
      .click();
    await expect(
      page.getByRole('button', { name: /Upgrade your plan/i }),
    ).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('check 4b: the profile menu opens, moves and closes from the keyboard', async () => {
    expect(dashboardPath, 'the dashboard was never opened').toBeTruthy();

    await page.goto(dashboardPath);

    const profile = page.getByRole('button', { name: /Anonymous/ }).first();
    const apiKeys = page.getByRole('link', { name: 'API keys' });

    await expect(profile).toHaveAttribute('aria-expanded', 'false');
    await profile.focus();
    await page.keyboard.press('Enter');

    await expect(profile).toHaveAttribute('aria-expanded', 'true');
    await expect(apiKeys).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(profile).toBeFocused();
    await expect(profile).toHaveAttribute('aria-expanded', 'false');

    await page.keyboard.press('Enter');
    await expect(apiKeys).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(apiKeys).toHaveCount(0);
    await expect(profile).toBeFocused();
  });

  test('check 5: a second URL reuses the same anonymous account', async () => {
    const userIdBefore = userIdFromToken(await readAccessToken(context));

    await page.goto('/');
    await startMonitoring(page, 'https://example.org');

    const tile = heroTile(page);

    await expect(tile.getByText('Your live monitor')).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      tile.getByRole('heading', { name: 'example.org', exact: true }),
    ).toBeVisible();

    const userIdAfter = userIdFromToken(await readAccessToken(context));

    expect(userIdAfter).toBe(userIdBefore);

    const stored = await readStoredPreview(page);

    expect(stored?.url).toBe('https://example.org');
    expect(stored?.clusterId).toBeTruthy();
  });

  test('check 11: the claim card signs in and onboards inside the dashboard, then opens it', async () => {
    await page.goto('/');

    const stored = await readStoredPreview(page);

    expect(stored?.url).toBe('https://example.org');

    await expectFullScreen(page, 'example.org', 'example.com');
    await expectClaimCard(page, 'example.org');

    await page.route('**/app/api/auth/oauth-start', (route) =>
      route.fulfill({ json: { url: '/app/auth/popup?status=ok' } }),
    );
    await page.route('**/app/api/auth/session', (route) =>
      route.fulfill({ json: { user: CLAIMED_USER, token: 'claimed' } }),
    );
    await page.route('**/app/api/onboarding/**', (route) =>
      route.fulfill({
        json: {
          ...CLAIMED_USER,
          termsAcceptedAt: new Date().toISOString(),
          onboardingCompletedAt: new Date().toISOString(),
        },
      }),
    );

    const card = claimCard(page);
    const popup = page.waitForEvent('popup');

    await card.getByRole('button', { name: 'Continue with GitHub' }).click();
    await (await popup).waitForEvent('close');

    await expect(page).toHaveURL('/');
    await expect(card.getByText('One last thing')).toBeVisible();

    await card.getByLabel(/I agree to the/).check();
    await card.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(card.getByText('Welcome to Logdash')).toBeVisible();

    for (const select of await card.getByRole('combobox').all()) {
      await select.selectOption({ index: 1 });
    }

    await card.getByRole('button', { name: 'Take me to my dashboard' }).click();

    await page.waitForURL(MONITORING_PATH, { timeout: 30_000 });
    await page.unrouteAll({ behavior: 'ignoreErrors' });

    expect(page.url()).toContain(
      `/app/domains/${stored!.clusterId}/${stored!.projectId}/monitoring`,
    );
    expect(await readStoredPreview(page)).toBeNull();
  });

  test('check 14: submitting from a feature page opens the full-screen preview on home', async () => {
    await page.goto('/features/monitoring');
    await startMonitoring(page, 'https://example.net');

    await expect(page).toHaveURL('/for/example.net');
    await expectFullScreen(page, 'example.net', 'example.com');
    await expect
      .poll(async () => (await readStoredPreview(page))?.url)
      .toBe('https://example.net');
  });
});

test.describe('expiry without a session', () => {
  test('check 10: an expired token redirects to the auth page', async ({
    page,
    context,
  }) => {
    // Signed with the same shape the backend issues, but expired an hour ago.
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        id: '000000000000000000000000',
        iat: Math.floor(Date.now() / 1000) - 7_200,
        exp: Math.floor(Date.now() / 1000) - 3_600,
      }),
    ).toString('base64url');

    await context.addCookies([
      {
        name: ACCESS_TOKEN_COOKIE,
        value: `${header}.${payload}.expired-signature`,
        domain: 'localhost',
        path: '/app',
      },
    ]);

    await page.goto('/app/domains');

    await page.waitForURL(/\/app\/auth\?expired=1/, { timeout: 30_000 });

    await expect(
      page.getByText(
        'Your temporary dashboard expired. Start a new one or sign in.',
      ),
    ).toBeVisible();
  });
});

test('check 16: an old /app/clusters link moves to /app/domains', async ({
  request,
}) => {
  const response = await request.get('/app/clusters/a/b/monitoring?claimed=1', {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe(
    '/app/domains/a/b/monitoring?claimed=1',
  );
});

test.describe('first check and the way in', () => {
  test('check 6: an address that does not resolve says why it is down', async ({
    page,
  }) => {
    const host = 'logdash-e2e.invalid';

    await page.goto('/');
    await startMonitoring(page, `https://${host}`);
    await expectFullScreen(page, host);

    const tile = heroTile(page);
    const card = claimCard(page);

    await expect(
      tile.getByText('Hostname does not resolve to a public address'),
    ).toBeVisible({ timeout: 30_000 });
    await expect(card.getByText(`${host} is not answering`)).toBeVisible();
    await expect(card).toContainText('tell you the moment it is back up.');
  });

  test('check 15: a subdomain URL with a path names the project after its domain and the service after the URL', async ({
    page,
  }) => {
    const domain = 'logdash-e2e.co.uk';
    const service = `app.${domain}/login`;

    await page.goto('/');
    await startMonitoring(page, `https://${service}`);
    await expectFullScreen(page, service, domain);

    await claimCard(page).getByRole('button', { name: 'Not now' }).click();
    await page
      .getByRole('button', { name: 'Open your dashboard' })
      .first()
      .click();
    await page.waitForURL(MONITORING_PATH, { timeout: 30_000 });

    await expect(
      page.getByRole('button', { name: domain, exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole('button', { name: service, exact: true }),
    ).toBeVisible();
  });

  test('check 12: a /for/ link starts monitoring that address once', async ({
    page,
  }) => {
    const created: string[] = [];

    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        /\/http_monitors$/.test(request.url())
      ) {
        created.push(request.url());
      }
    });

    await page.goto('/for/example.com');
    await expectFullScreen(page, 'example.com');
    await expect(page.locator('#hero-url-input')).toHaveValue('example.com');
    await expect
      .poll(async () => (await readStoredPreview(page))?.url)
      .toBe('https://example.com');

    await page.reload();
    await expectFullScreen(page, 'example.com');
    await expect(page).toHaveURL('/for/example.com');
    expect(created).toHaveLength(1);
  });

  test('check 12a: a /?url= link moves to the readable /for/ address', async ({
    page,
  }) => {
    await page.goto('/?url=example.com');
    await expectFullScreen(page, 'example.com');
    await expect(page).toHaveURL('/for/example.com');
  });

  test('check 12b: a /for/ link only fills the field for a signed-in account', async ({
    page,
  }) => {
    const created: string[] = [];

    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        /\/(projects|http_monitors)$/.test(request.url())
      ) {
        created.push(request.url());
      }
    });
    await page.route('**/app/api/auth/session', (route) =>
      route.fulfill({ json: { user: CLAIMED_USER, token: 'claimed' } }),
    );

    await page.goto('/for/example.com');

    const input = page.locator('#hero-url-input');
    await expect(input).toHaveValue('example.com');
    await expect(input).toBeFocused();
    await expect(fullScreenFrame(page)).toHaveCount(0);
    expect(created).toHaveLength(0);

    // A .md site is an address to watch, not a markdown twin of a page.
    await page.goto('/for/obsidian.md');
    await expect(input).toHaveValue('obsidian.md');
    await expect(page).toHaveTitle('obsidian.md · Logdash');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
  });

  test('check 13: a /?url= link to something that is not an address says so', async ({
    page,
  }) => {
    await page.goto('/?url=not a site');

    await expect(page.locator('#hero-url-status')).toHaveText(
      'That is not a valid URL. Try https://yourapp.com',
    );
    await expect(fullScreenFrame(page)).toHaveCount(0);
    expect(await readStoredPreview(page)).toBeNull();
  });

  test('check 7: Start monitoring in the nav puts the cursor in the hero field', async ({
    page,
  }) => {
    const field = page.locator('#hero-url-input');

    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Product' }).click();
    await page.getByRole('link', { name: 'Start monitoring' }).click();

    await expect(page).toHaveURL('/#hero-url-input');
    await expect(field).toBeFocused();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, 2_000));
    await page.getByRole('button', { name: 'Product' }).click();
    await page.getByRole('link', { name: 'Start monitoring' }).click();

    await expect(field).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('check 8: every way in lands on the same URL field', async ({
    page,
  }) => {
    const field = page.locator('#hero-url-input');

    await page.goto('/app/quick-setup');
    await expect(page).toHaveURL('/#hero-url-input');
    await expect(field).toBeFocused();

    await page.goto('/vs/uptime-robot');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Start free' }).first().click();
    await expect(page).toHaveURL('/#hero-url-input');
    await expect(field).toBeFocused();

    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Select Hobby' }).first().click();
    await expect(page).toHaveURL('/#hero-url-input');
    await expect(field).toBeFocused();

    await page.goto('/app/auth');
    await page
      .getByRole('link', { name: 'New here? Start with your website URL' })
      .click();
    await expect(page).toHaveURL('/#hero-url-input');
    await expect(field).toBeFocused();
  });

  test('check 9: a trial from pricing runs the same flow and carries the plan into the claim', async ({
    page,
  }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Start free trial' }).last().click();

    const trialHint = page.getByText(
      'Your Pro trial starts when you claim the dashboard.',
    );

    await expect(page).toHaveURL('/?tier=pro#hero-url-input');
    await expect(trialHint).toBeVisible();

    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
    await expect(trialHint).toBeHidden();

    await page.goBack();
    await expect(trialHint).toBeVisible();

    await startMonitoring(page, 'https://example.com');

    const card = claimCard(page);

    await expect(card).toContainText('then start your Pro trial.', {
      timeout: 30_000,
    });

    await page.route('**/app/api/auth/oauth-start', (route) =>
      route.fulfill({
        json: { url: '/app/auth/popup?status=error&reason=login-failed' },
      }),
    );

    const oauthStart = page.waitForRequest('**/app/api/auth/oauth-start');

    await card.getByRole('button', { name: 'Continue with GitHub' }).click();

    expect((await oauthStart).postDataJSON()).toMatchObject({
      provider: 'github',
      flow: 'claim',
      tier: 'pro',
    });
  });
});
