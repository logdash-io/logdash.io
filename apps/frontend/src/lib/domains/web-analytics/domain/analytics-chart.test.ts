import { expect, test } from '@playwright/test';
import * as d3 from 'd3';
import { lastBucketStart, lastCurveSegment } from './analytics-chart';

const line = d3
  .line<number>()
  .x((_, index) => index * 10)
  .y((value) => value)
  .curve(d3.curveMonotoneX);

test('the last segment of a curve starts at its second to last point', () => {
  const curve = line([5, 20, 10, 15]) ?? '';
  const segment = lastCurveSegment(curve);
  expect(segment).toMatch(/^M20,10C/);
  expect(curve.endsWith(segment.slice(segment.indexOf('C')))).toBe(true);
  expect(lastCurveSegment(line([5, 20]) ?? '')).toBe('M0,5L10,20');
});

test('a line that counts per bucket is in progress from the first tick of the last bucket', () => {
  const ticks = Array.from(
    { length: 15 },
    (_, index) => Date.parse('2026-09-18T00:00:00Z') + index * 86_400_000,
  );
  expect(lastBucketStart(ticks, 'day', 'UTC')).toBe(14);
  expect(lastBucketStart(ticks, 'week', 'UTC')).toBe(10);
  expect(lastBucketStart(ticks, 'month', 'UTC')).toBe(13);
  expect(lastBucketStart(ticks.slice(0, 3), 'month', 'UTC')).toBe(0);
  expect(lastBucketStart([], 'week', 'UTC')).toBe(-1);
});
