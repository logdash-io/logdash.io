import type { PingBucket } from '$lib/domains/app/projects/domain/monitoring/ping-bucket';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export type WatchHistory = {
  hours: (PingBucket | null)[];
  since: Date;
  outages: number;
};

export function watchHistory(
  hours: (PingBucket | null)[],
  days: (PingBucket | null)[],
  createdAt: number,
): WatchHistory | null {
  const firstHour = hours.find((bucket) => bucket !== null);
  const createdHour = createdAt - (createdAt % HOUR_MS);

  if (!firstHour || Date.parse(firstHour.timestamp) >= createdHour) {
    return null;
  }

  const hoursFrom = Date.parse(firstHour.timestamp);
  const overlap = days.findIndex(
    (day) => day !== null && Date.parse(day.timestamp) + DAY_MS > hoursFrom,
  );
  const earlierDays = overlap === -1 ? days : days.slice(0, overlap);
  const firstDay = earlierDays.find((bucket) => bucket !== null);

  return {
    hours,
    since: new Date(firstDay?.timestamp ?? firstHour.timestamp),
    outages: countOutages(earlierDays) + countOutages(hours),
  };
}

function countOutages(buckets: (PingBucket | null)[]): number {
  let outages = 0;
  let failing = false;

  for (const bucket of buckets) {
    const failed = (bucket?.failureCount ?? 0) > 0;

    if (failed && !failing) {
      outages += 1;
    }

    failing = failed;
  }

  return outages;
}
