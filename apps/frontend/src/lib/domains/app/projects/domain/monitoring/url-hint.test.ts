import { expect, test } from '@playwright/test';
import { isNameFromUrl } from '../../../../shared/utils/url';
import { urlHint, withPath } from './url-hint';

const NOTHING = { catchAll: false, healthPaths: [] };
const FOUND = { catchAll: false, healthPaths: ['/health', '/up'] };

test('an empty or invalid URL gets no hint', () => {
  expect(urlHint('', null)).toEqual({ kind: 'none' });
  expect(urlHint('not a url', FOUND)).toEqual({ kind: 'none' });
});

test('a root URL suggests a health path until the probe finds one', () => {
  expect(urlHint('acme.com', null)).toEqual({ kind: 'suggest-health' });
  expect(urlHint('https://acme.com/', NOTHING)).toEqual({
    kind: 'suggest-health',
  });
  expect(urlHint('https://acme.com', FOUND)).toEqual({
    kind: 'health-paths',
    healthPaths: ['/health', '/up'],
  });
});

test('a URL with a path only warns about a catch-all host', () => {
  expect(urlHint('acme.com/api/health', null)).toEqual({ kind: 'none' });
  expect(urlHint('acme.com/status', FOUND)).toEqual({ kind: 'none' });
  expect(urlHint('acme.com/?page=1', NOTHING)).toEqual({ kind: 'none' });
  expect(urlHint('acme.com/app', { catchAll: true, healthPaths: [] })).toEqual({
    kind: 'catch-all',
    healthPaths: [],
  });
});

test('a catch-all host wins over found health paths', () => {
  expect(
    urlHint('acme.com', { catchAll: true, healthPaths: ['/api/health'] }),
  ).toEqual({ kind: 'catch-all', healthPaths: ['/api/health'] });
});

test('withPath swaps the path and keeps the origin', () => {
  expect(withPath('acme.com', '/health')).toBe('https://acme.com/health');
  expect(withPath(' http://acme.com:8080/app?x=1 ', '/up')).toBe(
    'http://acme.com:8080/up',
  );
});

test('isNameFromUrl spots names generated from the URL', () => {
  expect(
    isNameFromUrl('acme.com/api/health', 'https://acme.com/api/health'),
  ).toBe(true);
  expect(isNameFromUrl('ACME.com', 'https://www.acme.com/')).toBe(true);
  expect(isNameFromUrl('www.acme.com', 'https://acme.com/api/health')).toBe(
    false,
  );
  expect(isNameFromUrl('acme.com', 'https://acme.com/api/health')).toBe(false);
  expect(isNameFromUrl('acme.com:8443', 'https://acme.com:8443')).toBe(true);
  expect(isNameFromUrl('API', 'https://acme.com/api/health')).toBe(false);
  expect(isNameFromUrl('acme.com', 'not a url')).toBe(false);
  expect(
    isNameFromUrl(
      `acme.com/${'a'.repeat(55)}`,
      `https://acme.com/${'a'.repeat(80)}`,
    ),
  ).toBe(true);
});
