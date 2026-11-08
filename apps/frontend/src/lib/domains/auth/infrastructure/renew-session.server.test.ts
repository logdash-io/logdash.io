import { expect, test } from '@playwright/test';
import type { Cookies } from '@sveltejs/kit';
import type { User } from '$lib/domains/shared/user/domain/user';
import { UserTier } from '$lib/domains/shared/types';
import { renewSessionIfNeeded } from './renew-session.server';

const DAY = 60 * 60 * 24;
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

const claimedUser = {
  id: 'user',
  tier: UserTier.FREE,
  accountClaimStatus: 'claimed',
  termsAcceptedAt: null,
  onboardingCompletedAt: null,
} satisfies User;

const anonymousUser = {
  ...claimedUser,
  accountClaimStatus: 'anonymous',
} satisfies User;

function tokenExpiringIn(seconds: number): string {
  const now = Math.floor(Date.now() / 1_000);
  const payload = Buffer.from(
    JSON.stringify({ id: claimedUser.id, iat: now, exp: now + seconds }),
  ).toString('base64url');

  return `header.${payload}.signature`;
}

function fakeCookies(): {
  cookies: Cookies;
  stored: { name: string; value: string; maxAge?: number }[];
} {
  const stored: { name: string; value: string; maxAge?: number }[] = [];

  return {
    stored,
    cookies: {
      set: (name: string, value: string, options: { maxAge?: number }) =>
        stored.push({ name, value, maxAge: options.maxAge }),
    } as unknown as Cookies,
  };
}

test('renews a claimed session that is close to expiring', async () => {
  const { cookies, stored } = fakeCookies();
  const renewed = tokenExpiringIn(7 * DAY);
  let calls = 0;

  globalThis.fetch = () => {
    calls += 1;

    return Promise.resolve(
      new Response(JSON.stringify({ token: renewed }), { status: 201 }),
    );
  };

  await renewSessionIfNeeded(
    cookies,
    tokenExpiringIn(DAY),
    claimedUser,
    'http://api.test',
  );

  expect(calls).toBe(1);
  expect(stored).toHaveLength(1);
  expect(stored[0].value).toBe(renewed);
  expect(stored[0].maxAge).toBeGreaterThan(6 * DAY);
});

test('leaves a claimed session alone while it has more than five days left', async () => {
  const { cookies, stored } = fakeCookies();
  let calls = 0;

  globalThis.fetch = () => {
    calls += 1;

    return Promise.resolve(new Response('{}', { status: 201 }));
  };

  await renewSessionIfNeeded(
    cookies,
    tokenExpiringIn(6 * DAY),
    claimedUser,
    'http://api.test',
  );

  expect(calls).toBe(0);
  expect(stored).toHaveLength(0);
});

test('never renews an anonymous session', async () => {
  const { cookies, stored } = fakeCookies();
  let calls = 0;

  globalThis.fetch = () => {
    calls += 1;

    return Promise.resolve(new Response('{}', { status: 201 }));
  };

  await renewSessionIfNeeded(
    cookies,
    tokenExpiringIn(DAY),
    anonymousUser,
    'http://api.test',
  );

  expect(calls).toBe(0);
  expect(stored).toHaveLength(0);
});

test('keeps the current token when the renewal call fails', async () => {
  const { cookies, stored } = fakeCookies();

  globalThis.fetch = () => Promise.resolve(new Response('{}', { status: 500 }));

  await renewSessionIfNeeded(
    cookies,
    tokenExpiringIn(DAY),
    claimedUser,
    'http://api.test',
  );

  expect(stored).toHaveLength(0);
});
