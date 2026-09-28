export function calculateUptime(
  buckets: ({ successCount: number; failureCount: number } | null)[],
): number | null {
  let successCount = 0;
  let totalCount = 0;

  for (const bucket of buckets) {
    successCount += bucket?.successCount ?? 0;
    totalCount += (bucket?.successCount ?? 0) + (bucket?.failureCount ?? 0);
  }

  return totalCount === 0 ? null : (successCount / totalCount) * 100;
}
