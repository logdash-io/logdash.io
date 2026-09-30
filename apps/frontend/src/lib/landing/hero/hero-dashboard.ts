import type {
  AnonymousPreviewDemo,
  AnonymousPreviewPhase,
} from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import type { Log } from '$lib/domains/logs/domain/log';
import { match } from 'ts-pattern';
import { getStatusFromPings } from '../../domains/app/projects/application/get-status-from-pings';
import {
  checkIntervalLabel,
  lastCheckLabel,
  monitorStats,
  noResponseReason,
  responseTimes,
  statusFromHttpPings,
  toChartPings,
  uptimeLabel,
  type MonitorStat,
  type MonitorStatus,
} from '../../domains/app/projects/application/monitor-pings';

export type HeroLive = {
  label: string;
  dot: 'success' | 'error' | 'neutral';
  pending: boolean;
};

export type HeroService = {
  name: string;
  status: MonitorStatus;
  pending: boolean;
};

export type HeroMetric = {
  id: string;
  name: string;
  value: number;
  samples: number[];
};

export type HeroLogRow = {
  key: number;
  at: Date;
  level: string;
  message: string;
};

export type HeroReading = {
  status: MonitorStatus;
  notice: string | null;
  stats: MonitorStat[];
  responseTimes: number[];
  checkingLabel: string;
  lastCheckLabel: string;
};

type ServiceSource = {
  phase: AnonymousPreviewPhase;
  previewHost: string | null;
  hasPreview: boolean;
  pings: HttpPing[];
  demo: Pick<AnonymousPreviewDemo, 'monitor' | 'pings'>;
};

export function heroLive(phase: AnonymousPreviewPhase): HeroLive {
  return match<AnonymousPreviewPhase, HeroLive>(phase)
    .with('creating', () => ({
      label: 'Starting',
      dot: 'neutral',
      pending: true,
    }))
    .with('previewing', 'idle', () => ({
      label: 'Live',
      dot: 'success',
      pending: false,
    }))
    .with('ended', () => ({
      label: 'Expired',
      dot: 'neutral',
      pending: false,
    }))
    .with('error', () => ({
      label: 'Stopped',
      dot: 'error',
      pending: false,
    }))
    .exhaustive();
}

export function heroService({
  phase,
  previewHost,
  hasPreview,
  pings,
  demo,
}: ServiceSource): HeroService {
  if (phase === 'creating') {
    return {
      name: previewHost ?? 'Setting up',
      status: 'unknown',
      pending: true,
    };
  }

  if (phase === 'idle' || !hasPreview || !previewHost) {
    return {
      name: demo.monitor?.name ?? '',
      status: statusFromHttpPings(demo.pings),
      pending: !demo.pings.length,
    };
  }

  return {
    name: previewHost,
    status: phase === 'previewing' ? statusFromHttpPings(pings) : 'unknown',
    pending: false,
  };
}

export function heroReading(
  pings: HttpPing[],
  now: number,
  waitingLabel: string,
): HeroReading {
  const chartPings = toChartPings(pings);
  const interval = checkIntervalLabel(chartPings);

  return {
    status: getStatusFromPings(chartPings),
    notice: noResponseReason(chartPings.at(-1)),
    stats: monitorStats(chartPings, {
      label: 'Uptime',
      value: uptimeLabel(chartPings) ?? '--',
    }),
    responseTimes: responseTimes(chartPings),
    checkingLabel: interval ? `Checking every ${interval}` : 'Checking',
    lastCheckLabel: lastCheckLabel(chartPings, now) ?? waitingLabel,
  };
}

export function heroLogRows(logs: Log[]): HeroLogRow[] {
  return logs.map((log) => ({
    key: parseInt(log.id.slice(-12), 16),
    at: new Date(log.createdAt),
    level: log.level,
    message: log.message,
  }));
}

export function heroMetrics(
  metrics: AnonymousPreviewDemo['metrics'],
): HeroMetric[] {
  return (metrics ?? []).map((metric) => ({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    samples: [...metric.history, metric.value],
  }));
}
