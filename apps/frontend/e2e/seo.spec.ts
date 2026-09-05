import { expect, test, type Locator, type Page } from '@playwright/test';

const SITE_ORIGIN = 'https://logdash.io';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5175';

const TITLE_MAX = 70;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 170;

/**
 * Every sitemap URL gets its own test so a failure names the page, and
 * Playwright needs the list before it registers anything, so the sitemap is
 * read here rather than in a fixture.
 */
const sitemapXml = await loadSitemap();
const sitemapUrls = parseLocs(sitemapXml);
const sitemapPaths = sitemapUrls.map(toPath);
/** Every generated SEO family obeys the same page contract. */
const FAMILY_PREFIXES = ['/alternatives/', '/health-check/'];

const familyPaths = sitemapPaths.filter((path) =>
  FAMILY_PREFIXES.some((prefix) => path.startsWith(prefix)),
);

async function loadSitemap(): Promise<string> {
  const response = await fetch(`${BASE_URL}/sitemap.xml`).catch(() => null);

  if (!response?.ok) {
    throw new Error(
      `Could not read ${BASE_URL}/sitemap.xml. Start the server first: VITE_API_BASE_URL=https://api.logdash.io npx vite dev --port 5175`,
    );
  }

  return response.text();
}

function parseLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1]
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&'),
  );
}

function toPath(url: string): string {
  return url.slice(SITE_ORIGIN.length) || '/';
}

async function attribute(
  page: Page,
  selector: string,
  name: string,
): Promise<string | null> {
  const node = page.locator(selector);

  if ((await node.count()) === 0) {
    return null;
  }

  return node.first().getAttribute(name);
}

function articleBody(page: Page): Locator {
  return page.locator('main article');
}

test.describe('sitemap', () => {
  test('the sitemap is well-formed XML listing every SEO page', async ({
    page,
  }) => {
    const parsed = await page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');

      if (doc.querySelector('parsererror')) {
        return null;
      }

      return [...doc.querySelectorAll('urlset > url > loc')].map(
        (loc) => loc.textContent ?? '',
      );
    }, sitemapXml);

    expect(parsed, 'sitemap.xml is not well-formed XML').not.toBeNull();
    expect(parsed).toEqual(sitemapUrls);
    expect(sitemapUrls.length).toBeGreaterThan(40);
  });

  test('the noindexed use-cases stub stays out of the sitemap', () => {
    expect(sitemapPaths).not.toContain('/use-cases');
  });

  test('robots.txt points at the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(`${SITE_ORIGIN}/sitemap.xml`);
  });
});

test.describe('every sitemap URL is crawlable', () => {
  // A crawler never runs the client bundle, so every check below reads the
  // server-rendered HTML with JavaScript switched off.
  test.use({ javaScriptEnabled: false });

  sitemapPaths.forEach((path, index) => {
    const url = sitemapUrls[index];

    test(`${path} serves indexable HTML`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status(), `${path} did not return 200`).toBe(200);

      const h1 = page.locator('h1');

      await expect(h1, `${path} needs exactly one h1`).toHaveCount(1);
      expect((await h1.innerText()).trim(), `${path} has an empty h1`).not.toBe(
        '',
      );

      expect(
        await attribute(page, 'link[rel=canonical]', 'href'),
        `${path} canonical does not match its sitemap entry`,
      ).toBe(url);

      const title = await page.title();

      expect(title, `${path} has no title`).not.toBe('');
      expect(
        title.length,
        `${path} title is ${title.length} chars: ${title}`,
      ).toBeLessThan(TITLE_MAX);

      const description = await attribute(
        page,
        'meta[name=description]',
        'content',
      );

      expect(description, `${path} has no meta description`).toBeTruthy();
      expect(
        description!.length,
        `${path} description is ${description!.length} chars`,
      ).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(
        description!.length,
        `${path} description is ${description!.length} chars`,
      ).toBeLessThanOrEqual(DESCRIPTION_MAX);

      const robots = await attribute(page, 'meta[name=robots]', 'content');

      expect(
        robots ?? '',
        `${path} is in the sitemap but noindexed`,
      ).not.toMatch(/noindex/);

      if (path.startsWith('/docs/')) {
        await expect(
          page.locator('pre code'),
          `${path} is an SDK doc with no code sample`,
        ).not.toHaveCount(0);
      }
    });
  });
});

test.describe('generated family pages', () => {
  test.use({ javaScriptEnabled: false });

  for (const path of familyPaths) {
    test(`${path} renders a complete article`, async ({ page }) => {
      await page.goto(path);

      const article = articleBody(page);

      await expect(article).toHaveCount(1);

      /**
       * innerText rather than textContent, because collapsed FAQ answers are
       * not text a reader sees and raw node text glues code samples onto the
       * prose. It runs above wordCount() on the page's blocks either way,
       * since the layout adds the H1, the answer line and the FAQ questions:
       * 697-784 measured across the 17 pages against wordCount()'s 571-652.
       * The range below is the 500-900 contract in seo-page.ts, not a fit to
       * today's numbers.
       */
      const words = (await article.innerText())
        .split(/\s+/)
        .filter(Boolean).length;

      expect(words, `${path} article is ${words} words`).toBeGreaterThanOrEqual(
        500,
      );
      expect(words, `${path} article is ${words} words`).toBeLessThanOrEqual(
        900,
      );

      await expect(
        article.locator('pre code'),
        `${path} has no code sample`,
      ).not.toHaveCount(0);

      /**
       * Only the alternatives family compares Logdash to something, so the
       * table is asserted there rather than on every family. Anchored on the
       * header row's text, so restyling cannot quietly make it a no-op.
       */
      if (path.startsWith('/alternatives/')) {
        const comparison = article
          .locator('table')
          .filter({ has: page.getByRole('columnheader', { name: 'Feature' }) })
          .filter({ has: page.getByRole('columnheader', { name: 'Logdash' }) });

        await expect(comparison, `${path} has no comparison table`).toHaveCount(
          1,
        );
        await expect(comparison.locator('tbody tr')).not.toHaveCount(0);
      }

      const faq = article.locator('details');
      const faqCount = await faq.count();

      expect(
        faqCount,
        `${path} has ${faqCount} FAQ items`,
      ).toBeGreaterThanOrEqual(3);
      expect(faqCount, `${path} has ${faqCount} FAQ items`).toBeLessThanOrEqual(
        5,
      );

      // The hub, three siblings and one feature page, and nothing else in the
      // document column: the whole internal link budget SeoPageLayout sets.
      await expect(
        page.locator('nav[aria-label="Keep reading"] a'),
      ).toHaveCount(5);
      await expect(page.locator('main a')).toHaveCount(5);
    });
  }
});

test.describe('deliberately unindexed routes', () => {
  test.use({ javaScriptEnabled: false });

  test('/use-cases is a 200 that asks not to be indexed', async ({ page }) => {
    const response = await page.goto('/use-cases');

    expect(response?.status()).toBe(200);
    expect(await attribute(page, 'meta[name=robots]', 'content')).toContain(
      'noindex',
    );
  });

  test('an unknown family slug is a 404', async ({ page }) => {
    const response = await page.goto('/alternatives/does-not-exist');

    expect(response?.status()).toBe(404);
  });
});
