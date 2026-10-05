import { expect, test } from '@playwright/test';
import { generateWebAnalyticsSetupPrompt } from './web-analytics-setup-prompt';

test('one prompt configures fixed first-party routes, anonymous tracking and server-only logging', () => {
  const prompt = generateWebAnalyticsSetupPrompt({
    services: [
      { name: 'Website', apiKey: 'server-only-key' },
      { name: 'API', apiKey: 'api-only-key' },
    ],
    siteId: '0123456789abcdef01234567',
    origins: ['https://example.com'],
    apiBaseUrl: 'https://api.example.com/',
    scriptBaseUrl: 'https://dashboard.example.com/',
  });
  expect(prompt).toContain(
    'POST /_ld/events proxies https://api.example.com/web_events',
  );
  expect(prompt).toContain(
    'GET /_ld/script.js proxies https://dashboard.example.com/sdk/web.js',
  );
  expect(prompt).toContain('data-site="0123456789abcdef01234567"');
  expect(prompt).toContain('- Website: server-only-key\n- API: api-only-key');
  expect(prompt).toContain('JavaScript or TypeScript: @logdash/node (npm)');
  expect(prompt).toContain('POST https://api.example.com/logs/batch');
  expect(prompt).toContain(
    'Forward the original browser Origin and User-Agent',
  );
  expect(prompt).not.toContain('Reject requests with an Origin');
  expect(prompt).toContain('ignores automated browsers');
  expect(prompt).toContain('There is no identify API');
  expect(prompt).toContain('existing analytics consent');
  expect(prompt).toContain(
    "30 minutes of inactivity or 24 hours, both shared across the site's subdomains",
  );
  expect(prompt).not.toContain('ask me about my preferred level');
  expect(prompt.match(/server-only-key/g)).toHaveLength(1);
});
