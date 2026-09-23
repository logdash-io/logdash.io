import { expect, test } from '@playwright/test';

test('metrics demo alerts only when CPU stays over the threshold', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');

  const alert = page
    .locator('section', {
      has: page.getByRole('img', { name: /CPU usage over/ }),
    })
    .getByRole('status');

  await expect(alert).toBeHidden();

  await page.clock.runFor(4_000);
  await expect(alert).toContainText(/Over 80% for \d\.\d{3} s/);
  await expect(alert).toContainText(/Alert in \d\.\d{3} s/);

  await page.clock.runFor(10_000);
  await expect(alert).toContainText('Alert sent to Telegram');

  await page.clock.runFor(7_000);
  await expect(alert).toContainText('Resolved after 17 s');

  await page.clock.runFor(44_000);
  await expect(alert).toContainText('3 s spike, no alert');
});
