export interface Ping {
  createdAt: string;
  statusCode: number;
  responseTimeMs: number;
}

export type SegmentStatus = "healthy" | "unhealthy";

export interface StatusSegment {
  status: SegmentStatus;
  pings: Ping[];
  startTime: Date;
  endTime: Date;
  pingCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
}

const isHealthyStatus = (statusCode: number): boolean =>
  statusCode >= 200 && statusCode < 400;

export const groupPingsByStatus = (pings: Ping[]): StatusSegment[] => {
  if (!pings.length) return [];

  const segments: StatusSegment[] = [];
  let currentSegment: StatusSegment | null = null;

  for (const ping of pings) {
    const pingStatus: SegmentStatus = isHealthyStatus(ping.statusCode)
      ? "healthy"
      : "unhealthy";
    const pingDate = new Date(ping.createdAt);

    if (!currentSegment || currentSegment.status !== pingStatus) {
      if (currentSegment) {
        segments.push(currentSegment);
      }

      currentSegment = {
        status: pingStatus,
        pings: [ping],
        startTime: pingDate,
        endTime: pingDate,
        pingCount: 1,
        avgResponseTime: ping.responseTimeMs,
        minResponseTime: ping.responseTimeMs,
        maxResponseTime: ping.responseTimeMs,
      };
    } else {
      currentSegment.pings.push(ping);
      currentSegment.endTime = pingDate;
      currentSegment.pingCount++;
      currentSegment.minResponseTime = Math.min(
        currentSegment.minResponseTime,
        ping.responseTimeMs
      );
      currentSegment.maxResponseTime = Math.max(
        currentSegment.maxResponseTime,
        ping.responseTimeMs
      );
      const totalResponseTime = currentSegment.pings.reduce(
        (sum, p) => sum + p.responseTimeMs,
        0
      );
      currentSegment.avgResponseTime =
        totalResponseTime / currentSegment.pingCount;
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const formatTimeRange = (start: Date, end: Date): string => {
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  if (start.getTime() === end.getTime()) {
    return formatTime(start);
  }

  return `${formatTime(start)} - ${formatTime(end)}`;
};
