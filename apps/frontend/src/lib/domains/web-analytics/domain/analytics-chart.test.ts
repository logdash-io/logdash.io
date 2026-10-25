import { expect, test } from '@playwright/test';
import * as d3 from 'd3';
import { lastCurveSegment } from './analytics-chart';

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
