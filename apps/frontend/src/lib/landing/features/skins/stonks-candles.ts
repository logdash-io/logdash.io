import type { Bucket } from '@logdash/status';
import { match } from 'ts-pattern';
import { dayStatus } from './skin-data';

export const IPO_PRICE = 100;

export const CHART_ROWS = 48;

const TOP_ROWS = 4;
const BOTTOM_ROWS = 7;
const MIN_BODY_ROWS = 3;
const VOLUME_ROWS = 6;

export type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
};

export type CandleShape = {
  rising: boolean;
  bodyTop: number;
  bodyHeight: number;
  wickTop: number;
  wickHeight: number;
  volumeHeight: number;
};

export function walkCandles(days: Bucket[]): (Candle | null)[] {
  let price = IPO_PRICE;

  return days.map((day, index) => {
    const status = dayStatus(day);

    if (status === 'none') return null;

    const daysAgo = days.length - 1 - index;
    const seed = Math.round(day.averageLatencyMs ?? 0);
    const failures = day.failureCount / (day.successCount + day.failureCount);
    const change = match(status)
      .with('up', () => 0.002 + noise(daysAgo, seed) * 0.011)
      .with('degraded', () => -(0.03 + failures * 0.6))
      .with('down', () => -(0.25 + failures * 0.25))
      .exhaustive();
    const open = price;
    const close = open * (1 + change);
    const wick = open * (status === 'up' ? 0.04 : 0.05);

    price = close;

    return {
      open,
      close,
      high: Math.max(open, close) + wick * noise(daysAgo, seed + 1),
      low: Math.min(open, close) - wick * noise(daysAgo, seed + 2),
      volume: status === 'up' ? 0.1 + noise(daysAgo, seed + 3) * 0.5 : 1,
    };
  });
}

export function plotCandles(days: Bucket[]): (CandleShape | null)[] {
  const candles = walkCandles(days);
  const traded = candles.filter((candle) => candle !== null);
  const high = Math.max(...traded.map((candle) => candle.high));
  const low = Math.min(...traded.map((candle) => candle.low));
  const scale = (CHART_ROWS - TOP_ROWS - BOTTOM_ROWS) / (high - low || 1);
  const row = (price: number): number =>
    Math.round(TOP_ROWS + (high - price) * scale);

  return candles.map((candle) => {
    if (!candle) return null;

    const bodyTop = row(Math.max(candle.open, candle.close));
    const bodyBottom = Math.max(
      row(Math.min(candle.open, candle.close)),
      bodyTop + MIN_BODY_ROWS,
    );
    const wickTop = Math.min(row(candle.high), bodyTop - 1);
    const wickBottom = Math.max(row(candle.low), bodyBottom + 1);

    return {
      rising: candle.close >= candle.open,
      bodyTop: percent(bodyTop),
      bodyHeight: percent(bodyBottom - bodyTop),
      wickTop: percent(wickTop),
      wickHeight: percent(wickBottom - wickTop),
      volumeHeight: percent(1 + Math.round(candle.volume * (VOLUME_ROWS - 1))),
    };
  });
}

function percent(rows: number): number {
  return (rows / CHART_ROWS) * 100;
}

function noise(daysAgo: number, seed: number): number {
  let hash = Math.imul(daysAgo + 1, 0x9e3779b1) ^ Math.imul(seed, 0x85ebca77);

  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39);

  return ((hash ^ (hash >>> 15)) >>> 0) / 4_294_967_296;
}
