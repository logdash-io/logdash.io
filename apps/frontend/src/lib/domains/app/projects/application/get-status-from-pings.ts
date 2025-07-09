export const getStatusFromPings = (
  pings: { statusCode: number }[],
): 'up' | 'down' | 'degraded' | 'unknown' => {
  if (!pings.length) return 'unknown';

  const latestPing = pings[0];
  const latestIsHealthy =
    latestPing.statusCode >= 200 && latestPing.statusCode < 400;

  if (!latestIsHealthy) {
    return 'down';
  }

  const recentPings = pings.slice(0, 10);
  const hasRecentErrors = recentPings.some(
    (ping) => ping.statusCode < 200 || ping.statusCode >= 400,
  );

  if (hasRecentErrors) {
    return 'degraded';
  }

  return 'up';
};
