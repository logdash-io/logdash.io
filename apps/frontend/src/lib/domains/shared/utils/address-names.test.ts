import { expect, test } from '@playwright/test';
import { clusterNameFromUrl, previewNameFromUrl } from './address-names';

test('a new cluster is named after the registrable domain of the first URL', async () => {
  expect(await clusterNameFromUrl('https://app.acme.co.uk/login')).toBe(
    'acme.co.uk',
  );
  expect(await clusterNameFromUrl('https://www.acme.com')).toBe('acme.com');
  expect(await clusterNameFromUrl('https://my-app.vercel.app/')).toBe(
    'my-app.vercel.app',
  );
  expect(await clusterNameFromUrl('http://203.0.113.7:8080/up')).toBe(
    '203.0.113.7',
  );
});

test('a service is named after its URL, so paths on one host stay apart', () => {
  expect(previewNameFromUrl('https://www.acme.com/')).toBe('acme.com');
  expect(previewNameFromUrl('https://acme.com/api/health')).toBe(
    'acme.com/api/health',
  );
  expect(
    previewNameFromUrl(`https://acme.com/${'a'.repeat(100)}`),
  ).toHaveLength(64);
  expect(previewNameFromUrl(`https://acme.com/${'b'.repeat(54)}/more`)).toBe(
    `acme.com/${'b'.repeat(54)}`,
  );
});
