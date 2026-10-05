import { expect, test } from '@playwright/test';
import { parseOrigin, websiteUrlFromName } from './web-analytics-origin';

test('origins are HTTPS, or HTTP on localhost, reduced to scheme and host', () => {
  expect(parseOrigin('example.com')).toBe('https://example.com');
  expect(parseOrigin(' https://App.Example.com/pricing?a=1 ')).toBe(
    'https://app.example.com',
  );
  expect(parseOrigin('https://example.com:8443')).toBe(
    'https://example.com:8443',
  );
  expect(parseOrigin('http://localhost:3000')).toBe('http://localhost:3000');
  expect(parseOrigin('http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173');
  expect(parseOrigin('http://example.com')).toBeNull();
  expect(parseOrigin('ftp://example.com')).toBeNull();
  expect(parseOrigin('https://user:pass@example.com')).toBeNull();
  expect(parseOrigin('intranet')).toBeNull();
  expect(parseOrigin('')).toBeNull();
});

test('a domain name becomes the website URL only when it is a hostname', () => {
  expect(websiteUrlFromName('example.com')).toBe('https://example.com');
  expect(websiteUrlFromName('My website')).toBe('');
  expect(websiteUrlFromName('localhost')).toBe('https://localhost');
  expect(websiteUrlFromName(undefined)).toBe('');
});
