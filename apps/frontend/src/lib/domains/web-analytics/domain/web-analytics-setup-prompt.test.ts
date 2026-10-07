import { expect, test } from '@playwright/test';
import { generateWebAnalyticsSetupPrompt } from './web-analytics-setup-prompt';

test('one prompt configures fixed first-party routes, cookieless tracking, identify and server-only logging', () => {
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
  expect(prompt).toContain(
    "set x-logdash-client-ip to the browser's IP address, read with the framework's client address helper",
  );
  expect(prompt).toContain('It sets no cookies');
  expect(prompt).toContain(
    "whether the site needs consent is its owner's decision",
  );
  expect(prompt).not.toContain('analytics consent');
  expect(prompt).not.toContain('visitor cookie');
  expect(prompt).toContain('window.logdash?.identify(user.id)');
  expect(prompt).toContain('window.logdash?.identify(null) on sign-out');
  expect(prompt).toContain('never an email, name or other personal data');
  expect(prompt).toContain(
    'window.logdash?.optOut() and window.logdash?.optIn()',
  );
  expect(prompt).toContain('document.cookie holds no ldv_ or lds_ cookies');
  expect(prompt).toContain('Keep the upstream URL fixed');
  expect(prompt).not.toContain('ask me about my preferred level');
  expect(prompt.match(/server-only-key/g)).toHaveLength(1);
  expect(prompt).toContain(
    'directly, and the backend sends and flushes one real setup log.',
  );
  expect(prompt).toContain('3. Verify the full integration');
});

test('a domain without services gets a web analytics prompt without backend logging', () => {
  const prompt = generateWebAnalyticsSetupPrompt({
    services: [],
    siteId: '0123456789abcdef01234567',
    origins: ['https://example.com'],
    apiBaseUrl: 'https://api.example.com',
    scriptBaseUrl: 'https://dashboard.example.com',
  });
  expect(prompt).toContain(
    'POST /_ld/events proxies https://api.example.com/web_events',
  );
  expect(prompt).toContain('window.logdash?.identify(user.id)');
  expect(prompt).not.toContain('ingest keys:');
  expect(prompt).not.toContain('Backend logging');
  expect(prompt).not.toContain('LOGDASH_API_KEY');
  expect(prompt).toContain(
    'and the browser never calls the upstream analytics host directly. Check',
  );
  expect(prompt).toContain('2. Verify the full integration');
  expect(prompt).toContain('Logdash verifies receipt of web events.');
  expect(prompt).toContain(
    'Report the changed files and verification results.',
  );
});
