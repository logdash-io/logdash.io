import { expect, test } from '@playwright/test';
import { safe_redirect_path } from './safe-redirect.util';

const FALLBACK = '/app/domains';

test('same-origin paths pass with their query and hash', () => {
  expect(safe_redirect_path('/', FALLBACK)).toBe('/');
  expect(safe_redirect_path('/app/domains/1/2?claimed=1', FALLBACK)).toBe(
    '/app/domains/1/2?claimed=1',
  );
  expect(safe_redirect_path('/app/x?a=1&b=%2F#h', FALLBACK)).toBe(
    '/app/x?a=1&b=%2F#h',
  );
  expect(safe_redirect_path('/%09/evil.example', FALLBACK)).toBe(
    '/%09/evil.example',
  );
  expect(safe_redirect_path('/%2F%2Fevil.example', FALLBACK)).toBe(
    '/%2F%2Fevil.example',
  );
  expect(safe_redirect_path('/app\t/x', FALLBACK)).toBe('/app/x');
});

test('anything a browser would send to another origin falls back', () => {
  const attacks = [
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example/x',
    '/\n/evil.example',
    '/\r/evil.example',
    '/\t\\evil.example',
    '\t//evil.example',
    '/..//evil.example',
    '/.//evil.example',
    '/%2e%2e//evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    'evil.example',
    '',
  ];

  for (const attack of attacks) {
    expect(safe_redirect_path(attack, FALLBACK), attack).toBe(FALLBACK);
  }
});

test('non-string values fall back', () => {
  expect(safe_redirect_path(undefined, FALLBACK)).toBe(FALLBACK);
  expect(safe_redirect_path(null, FALLBACK)).toBe(FALLBACK);
  expect(safe_redirect_path(['/app'], FALLBACK)).toBe(FALLBACK);
});
