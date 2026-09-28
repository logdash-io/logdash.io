import { expect, test, type Page } from '@playwright/test';

const STATUS_PAGE_ID = process.env.E2E_STATUS_PAGE_ID;
const STATUS_PAGE_APP_URL = process.env.E2E_STATUS_PAGE_APP_URL;
const HEADLINE =
  /All systems operational|Partial outage|Major outage|Status unknown/;
const DAY_LABEL = /^[A-Z][a-z]{2} \d{1,2}, \d{4}: /;

async function open(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByText(/^Updated /)).toBeVisible();
}

const TARGETS = [
  { name: 'frontend', url: (id: string): string => `/d/${id}` },
  ...(STATUS_PAGE_APP_URL
    ? [
        {
          name: 'status-page app',
          url: (id: string): string =>
            `${STATUS_PAGE_APP_URL}/?custom-domain=${id}`,
        },
      ]
    : []),
];

for (const target of TARGETS) {
  test.describe(`hosted status page (${target.name})`, () => {
    test('an unknown status page is a 404', async ({ page }) => {
      const response = await page.goto(target.url('000000000000000000000000'));

      expect(response?.status()).toBe(404);
      await expect(
        page.getByRole('heading', { name: 'Status page not found' }),
      ).toBeVisible();
    });

    test.describe('seeded page', () => {
      test.skip(
        !STATUS_PAGE_ID,
        'Set E2E_STATUS_PAGE_ID to a public status page on the backend',
      );

      test('shows every monitor expanded with 90 days of history', async ({
        page,
      }) => {
        await open(page, target.url(STATUS_PAGE_ID!));

        const name = page.getByRole('heading', { level: 1 });

        await expect(page.getByText(HEADLINE)).toBeVisible();
        await expect(page).toHaveTitle(await name.innerText());
        await expect(page.getByText(/Auto-refresh/)).toHaveCount(0);

        const grids = await page.getByRole('grid').all();

        expect(grids.length).toBeGreaterThan(0);

        for (const grid of grids) {
          await expect(grid.getByRole('gridcell')).toHaveCount(90);
          await expect(grid.locator('[tabindex="0"]')).toHaveCount(1);
        }
      });

      test('each day explains itself on hover and on keyboard focus', async ({
        page,
      }) => {
        await open(page, target.url(STATUS_PAGE_ID!));

        const days = page.getByRole('grid').first().getByRole('gridcell');

        await days.nth(45).hover();
        await expect(page.getByText('UTC', { exact: true })).toBeVisible();

        await page.mouse.move(0, 0);
        await page.keyboard.press('Tab');
        await expect(days.last()).toBeFocused();
        await expect(days.last()).toHaveAttribute('aria-label', DAY_LABEL);

        await page.keyboard.press('ArrowLeft');
        await expect(days.nth(88)).toBeFocused();
        await expect(page.getByText('UTC', { exact: true })).toBeVisible();

        await page.keyboard.press('Home');
        await expect(days.first()).toBeFocused();
      });

      test('keeps its data and shows its age when a refresh fails', async ({
        page,
      }) => {
        let refreshes = 0;

        await page.clock.install();
        await open(page, target.url(STATUS_PAGE_ID!));

        await page.route('**/v1/status_pages/**', async (route) => {
          refreshes++;
          await route.abort();
        });
        await page.clock.runFor(125_000);

        expect(refreshes).toBeGreaterThan(0);
        await expect(page.getByText(HEADLINE)).toBeVisible();
        await expect(page.getByText(/^Updated \d+ min ago$/)).toBeVisible();
        await expect(page.getByRole('grid').first()).toBeVisible();
      });
    });
  });
}
