import { expect, test } from '@playwright/test';
import { IPO_PRICE, plotCandles, walkCandles } from './stonks-candles';

const day = (successCount: number, failureCount: number) => ({
  timestamp: '2026-09-28T00:00:00.000Z',
  successCount,
  failureCount,
  averageLatencyMs: successCount ? 120 : null,
});

test('walks uptime into candles that dip exactly on incident days', () => {
  const days = [
    day(0, 0),
    day(1440, 0),
    day(1440, 0),
    day(1400, 40),
    day(1440, 0),
    day(500, 940),
    day(1440, 0),
  ];
  const candles = walkCandles(days);
  const traded = candles.filter((candle) => candle !== null);

  expect(candles[0]).toBeNull();
  expect(traded).toHaveLength(6);
  expect(traded[0].open).toBe(IPO_PRICE);
  expect(walkCandles(days)).toEqual(candles);

  for (const [position, candle] of traded.entries()) {
    expect(candle.close < candle.open).toBe(position === 2 || position === 4);
    expect(candle.high).toBeGreaterThanOrEqual(
      Math.max(candle.open, candle.close),
    );
    expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
    if (position) expect(candle.open).toBe(traded[position - 1].close);
  }

  const drop = (candle: (typeof traded)[number]): number =>
    1 - candle.close / candle.open;

  expect(drop(traded[4])).toBeGreaterThan(drop(traded[2]));

  for (const shape of plotCandles(days).filter((shape) => shape !== null)) {
    expect(shape.wickTop).toBeGreaterThanOrEqual(0);
    expect(shape.wickTop + shape.wickHeight).toBeLessThanOrEqual(100);
    expect(shape.bodyTop).toBeGreaterThan(shape.wickTop);
  }
});
