import { expect, test } from '@playwright/test';
import type { CaptureResult } from 'posthog-js';
import { dropThirdPartyExceptions } from './drop-third-party-exceptions';

const ORIGIN = 'https://logdash.io';

function exception(...filenames: (string | undefined)[]): CaptureResult {
  return {
    uuid: 'id',
    event: '$exception',
    properties: {
      $exception_list: [
        { stacktrace: { frames: filenames.map((filename) => ({ filename })) } },
      ],
    },
  };
}

test('keeps an exception with at least one frame from our origin', () => {
  const events = [
    exception(`${ORIGIN}/_app/immutable/chunks/a.js`),
    exception(
      'chrome-extension://abc/content.js',
      `${ORIGIN}/_app/immutable/entry/app.js`,
    ),
    exception('/_app/immutable/chunks/a.js'),
    exception(`blob:${ORIGIN}/7f1c`),
    exception(),
    { ...exception(), properties: {} },
  ];

  for (const event of events) {
    expect(dropThirdPartyExceptions(event, ORIGIN)).toBe(event);
  }
});

test('drops an exception whose frames never touch our origin', () => {
  const events = [
    exception('chrome-extension://abc/content.js'),
    exception('https://cdn.example.com/widget.js', '<anonymous>'),
    exception('//logdash.io.example.com/a.js'),
    exception(undefined, undefined),
  ];

  for (const event of events) {
    expect(dropThirdPartyExceptions(event, ORIGIN)).toBeNull();
  }
});

test('lets every other event through untouched', () => {
  const pageview: CaptureResult = {
    uuid: 'id',
    event: '$pageview',
    properties: {},
  };

  expect(dropThirdPartyExceptions(pageview, ORIGIN)).toBe(pageview);
  expect(dropThirdPartyExceptions(null, ORIGIN)).toBeNull();
});
