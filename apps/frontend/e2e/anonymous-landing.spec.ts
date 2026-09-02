import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const ACCESS_TOKEN_COOKIE = 'logdash_access_token_v0';
const PREVIEW_STORAGE_KEY = 'logdash_anonymous_preview_v0';
const MONITORING_PATH = /\/app\/clusters\/[^/]+\/[^/]+\/monitoring/;

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

test.describe('anonymous landing flow', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;
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
      tile.getByText(/Live: our production API|Your live monitor/),
    ).toBeVisible();
    await expect(page.getByLabel('Your app URL').first()).toBeVisible();

    // Give client-side hydration and the demo poll a beat to surface errors.
    await page.waitForTimeout(2_000);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('check 2: submitting a URL starts a live preview and sets the app-scoped token', async () => {
    await startMonitoring(page, 'https://example.com');

    const tile = heroTile(page);

    await expect(tile.getByText('Your live monitor')).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      tile.getByRole('heading', { name: 'example.com' }),
    ).toBeVisible();
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

  test('check 3: reloading the landing restores the preview from sessionStorage', async () => {
    const before = await readStoredPreview(page);

    await page.reload();

    const tile = heroTile(page);

    await expect(tile.getByText('Your live monitor')).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      tile.getByRole('heading', { name: 'example.com' }),
    ).toBeVisible();

    const after = await readStoredPreview(page);

    expect(after?.monitorId).toBe(before?.monitorId);
    expect(after?.projectId).toBe(before?.projectId);
  });

  test('check 4: opening the dashboard lands on monitoring with a claim banner and no upgrade', async () => {
    const stored = await readStoredPreview(page);

    expect(stored, 'no preview to open').toBeTruthy();

    await page
      .getByRole('button', { name: 'Open your dashboard' })
      .first()
      .click();

    await page.waitForURL(MONITORING_PATH, { timeout: 30_000 });

    expect(page.url()).toContain(
      `/app/clusters/${stored!.clusterId}/${stored!.projectId}/monitoring`,
    );

    const claimBanner = page.getByText('Temporary dashboard.');

    await expect(claimBanner).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Expires in \d+h \d+m\./)).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Claim with GitHub or Google' }),
    ).toBeVisible();

    // The monitor carried over with its pings.
    await expect(page.getByText('example.com').first()).toBeVisible({
      timeout: 30_000,
    });

    // Anonymous users cannot upgrade, so the profile menu offers no upgrade.
    await page.getByRole('button', { name: 'Account' }).first().click();
    await expect(
      page.getByRole('button', { name: /Upgrade your plan/i }),
    ).toHaveCount(0);
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
      tile.getByRole('heading', { name: 'example.org' }),
    ).toBeVisible();

    const userIdAfter = userIdFromToken(await readAccessToken(context));

    expect(userIdAfter).toBe(userIdBefore);

    const stored = await readStoredPreview(page);

    expect(stored?.url).toBe('https://example.org');
    expect(stored?.clusterId).toBeTruthy();
  });

  test('check 9a: quick setup with a session redirects to the clusters list', async () => {
    await page.goto('/app/quick-setup');

    await page.waitForURL(/\/app\/clusters/, { timeout: 30_000 });

    expect(page.url()).toContain('/app/clusters');
  });
});

test.describe('quick setup and expiry without a session', () => {
  test.describe.configure({ mode: 'serial' });

  test('check 9b: quick setup without a session creates a fresh dashboard', async ({
    page,
  }) => {
    await page.goto('/app/quick-setup');

    const createButton = page.getByRole('button', {
      name: 'Create your dashboard',
    });

    await expect(createButton).toBeVisible({ timeout: 30_000 });

    await createButton.click();

    await page.waitForURL(/\/app\/clusters\/[^/]+\/[^/]+/, { timeout: 30_000 });

    expect(page.url()).toMatch(/\/app\/clusters\/[^/]+\/[^/]+/);
  });

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

    await page.goto('/app/clusters');

    await page.waitForURL(/\/app\/auth\?expired=1/, { timeout: 30_000 });

    await expect(
      page.getByText(
        'Your temporary dashboard expired. Start a new one or sign in.',
      ),
    ).toBeVisible();
  });
});
