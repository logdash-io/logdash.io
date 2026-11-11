import { DateTime } from 'luxon';
import type { WebAnalyticsInsightBucket } from './web-analytics';

export function lastCurveSegment(curve: string): string {
  const last = curve.lastIndexOf('C');
  if (last < 0) return curve;
  const from = curve.slice(0, last).split(/[MC,]/).slice(-2).join();
  return `M${from}${curve.slice(last)}`;
}

// The index of the first tick in the last bucket, where a line that counts per bucket
// starts its in-progress part. The zone is the one of the ticks, the viewer's by default.
export function lastBucketStart(
  times: number[],
  bucket: WebAnalyticsInsightBucket,
  zone?: string,
): number {
  const last = times.at(-1);
  if (last === undefined) return -1;
  const start = DateTime.fromMillis(last, { zone }).startOf(bucket).toMillis();
  return times.findIndex((time) => time >= start);
}
