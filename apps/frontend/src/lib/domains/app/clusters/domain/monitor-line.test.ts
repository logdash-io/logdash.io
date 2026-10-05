import { expect, test } from '@playwright/test';
import { monitorLine, newSuggestions } from './monitor-line';

test('a monitor line reads the latest ping, then the stored status', () => {
  const unchecked = { lastStatus: 'unknown' as const, lastStatusCode: 0 };

  expect(monitorLine(undefined, unchecked)).toEqual({
    tone: 'idle',
    text: 'Checking…',
  });
  expect(
    monitorLine({ statusCode: 200, responseTimeMs: 212 }, unchecked),
  ).toEqual({ tone: 'up', text: 'Up · 212 ms' });
  expect(
    monitorLine(undefined, { lastStatus: 'up', lastStatusCode: 301 }),
  ).toEqual({ tone: 'up', text: 'Up' });
  expect(
    monitorLine(
      { statusCode: 503, responseTimeMs: 40 },
      { lastStatus: 'up', lastStatusCode: 200 },
    ),
  ).toEqual({ tone: 'down', text: 'Down · 503' });
  expect(monitorLine({ statusCode: 0, responseTimeMs: 0 }, unchecked)).toEqual({
    tone: 'down',
    text: 'Not answering',
  });
});

test('suggestions skip addresses that are already monitored', () => {
  expect(
    newSuggestions(
      ['https://api.example.com/', 'https://example.com/health'],
      ['https://www.example.com', 'https://api.example.com'],
    ),
  ).toEqual(['https://example.com/health']);
});
