import { expect, test } from '@playwright/test';
import { DayScrub } from './day-scrub';

test('a fast pass over the strip previews and keeps nothing', () => {
  const scrub = new DayScrub();
  expect(scrub.move({ x: 100, y: 0, time: 0 }, 3)).toBeNull();
  expect(scrub.move({ x: 100, y: 40, time: 16 }, 3)).toBeNull();
  expect(scrub.move({ x: 100, y: 80, time: 32 }, 3)).toBeNull();
  expect(scrub.leave(48)).toBeNull();
});

test('slowing down over a day previews it, then every day follows at once', () => {
  const scrub = new DayScrub();
  scrub.move({ x: 100, y: 0, time: 0 }, 3);
  expect(scrub.move({ x: 102, y: 0, time: 16 }, 3)).toBe(3);
  expect(scrub.move({ x: 160, y: 0, time: 24 }, 4)).toBe(4);
  expect(scrub.move({ x: 220, y: 0, time: 32 }, null)).toBeNull();
});

test('resting without moving previews the day under the pointer', () => {
  const scrub = new DayScrub();
  expect(scrub.move({ x: 100, y: 0, time: 0 }, 7)).toBeNull();
  expect(scrub.rest()).toBe(7);
});

test('leaving keeps the last day the pointer settled on', () => {
  const scrub = new DayScrub();
  scrub.move({ x: 100, y: 0, time: 0 }, 3);
  scrub.move({ x: 101, y: 0, time: 16 }, 3);
  scrub.move({ x: 130, y: 20, time: 400 }, 4);
  expect(scrub.leave(430)).toBe(3);
});

test('leaving after settling on a day keeps that day', () => {
  const scrub = new DayScrub();
  scrub.move({ x: 100, y: 0, time: 0 }, 3);
  scrub.move({ x: 101, y: 0, time: 16 }, 3);
  scrub.move({ x: 140, y: 0, time: 200 }, 4);
  expect(scrub.leave(300)).toBe(4);
  expect(scrub.move({ x: 140, y: 0, time: 900 }, 4)).toBeNull();
});
