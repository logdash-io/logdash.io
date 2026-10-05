import { expect, test } from '@playwright/test';
import { parseDomainSetups, serializeDomainSetups } from './domain-setup';

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';

test('open domain setups round trip through the cookie and drop junk', () => {
  expect(parseDomainSetups(undefined)).toEqual([]);
  expect(parseDomainSetups(`${A}.not-an-id.${B}`)).toEqual([A, B]);
  expect(serializeDomainSetups([A, B, A])).toBe(`${A}.${B}`);
  expect(
    parseDomainSetups(
      serializeDomainSetups(
        Array.from({ length: 30 }, (_, index) =>
          index.toString(16).padStart(24, '0'),
        ),
      ),
    ),
  ).toHaveLength(20);
});
