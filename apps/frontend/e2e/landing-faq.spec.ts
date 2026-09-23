import { expect, test, type Page } from '@playwright/test';

const QUESTION = 'How long do you keep logs on the free plan?';
const ANSWER = 'Logs on the Hobby plan are kept for 24 hours.';

async function openFaq(page: Page): Promise<void> {
  await page.goto('/#faq');
  await page.waitForLoadState('networkidle');
  await page.locator('#faq').scrollIntoViewIfNeeded();
}

test('a question turns its plus into a minus when it opens', async ({
  page,
}) => {
  await openFaq(page);

  const item = page.locator('#faq details').first();
  const verticalBar = item.locator('svg path').nth(1);

  await expect(verticalBar).toHaveCSS('rotate', 'none');

  await item.locator('summary').click();

  await expect(item).toHaveAttribute('open', '');
  await expect(verticalBar).toHaveCSS('rotate', '90deg');
});

test('asking AI adds the question with its answer above the input', async ({
  page,
}) => {
  let askedWith: unknown = null;

  await page.route('**/api/ask', async (route) => {
    askedWith = route.request().postDataJSON();
    await route.fulfill({ json: { answer: ANSWER } });
  });

  await openFaq(page);

  const input = page.getByRole('textbox', {
    name: 'Ask AI a question about Logdash',
  });
  const send = page.getByRole('button', { name: 'Send question' });

  await expect(send).toBeDisabled();

  await input.fill(QUESTION);
  await input.press('Enter');

  const asked = page.locator('#faq details', { hasText: QUESTION });

  await expect(asked).toHaveAttribute('open', '');
  await expect(asked).toContainText(ANSWER);
  await expect(asked).toContainText('Answered by AI');
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  expect(askedWith).toEqual({ question: QUESTION });
});

test('a rate-limited question points to Discord', async ({ page }) => {
  await page.route('**/api/ask', (route) =>
    route.fulfill({ status: 429, json: { message: 'Too many questions.' } }),
  );

  await openFaq(page);

  const input = page.getByRole('textbox', {
    name: 'Ask AI a question about Logdash',
  });

  await input.fill(QUESTION);
  await input.press('Enter');

  const asked = page.locator('#faq details', { hasText: QUESTION });

  await expect(asked).toContainText('Try again in a minute');
  await expect(
    asked.getByRole('link', { name: 'ask us on Discord.' }),
  ).toHaveAttribute('href', 'https://discord.gg/naftPW4Hxe');
});
