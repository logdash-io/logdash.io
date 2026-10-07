import type {
  AnonymousPreviewDemo,
  AnonymousPreviewPhase,
} from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping';
import {
  bucketUptime,
  type PingBucket,
} from '$lib/domains/app/projects/domain/monitoring/ping-bucket';
import { uptimeStat } from '$lib/domains/app/projects/ui/service/monitor-panel-content';
import { match } from 'ts-pattern';
import { getStatusFromPings } from '../../domains/app/projects/application/get-status-from-pings';
import {
  checkIntervalLabel,
  checkingLabel,
  lastCheckLabel,
  monitorStats,
  noResponseReason,
  responseTimes,
  statusFromHttpPings,
  toChartPings,
  type MonitorStat,
  type MonitorStatus,
} from '../../domains/app/projects/application/monitor-pings';

const PLACEHOLDER_HOST = 'yourapp.com';

export type HeroLive = {
  label: string;
  dot: 'success' | 'error' | 'neutral';
  pending: boolean;
};

export type HeroMonitor = {
  name: string;
  url: string | null;
  status: MonitorStatus;
  pending: boolean;
};

export type HeroReading = {
  status: MonitorStatus;
  notice: string | null;
  stats: MonitorStat[];
  responseTimes: number[];
  checkingLabel: string;
  lastCheckLabel: string;
};

type MonitorSource = {
  phase: AnonymousPreviewPhase;
  previewHost: string | null;
  previewUrl: string | null;
  hasPreview: boolean;
  pings: HttpPing[];
  demo: Pick<AnonymousPreviewDemo, 'monitor' | 'pings' | 'loaded'>;
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

export function heroMonitor({
  phase,
  previewHost,
  previewUrl,
  hasPreview,
  pings,
  demo,
}: MonitorSource): HeroMonitor {
  if (phase === 'creating') {
    return {
      name: previewHost ?? 'Setting up',
      url: previewUrl,
      status: 'unknown',
      pending: true,
    };
  }

  if (phase === 'idle' || !hasPreview || !previewHost) {
    return {
      name: demoName(demo),
      url: demo.monitor?.url ?? null,
      status: statusFromHttpPings(demo.pings),
      pending: !demo.pings.length,
    };
  }

  return {
    name: previewHost,
    url: previewUrl,
    status: phase === 'previewing' ? statusFromHttpPings(pings) : 'unknown',
    pending: false,
  };
}

export function heroReading(
  pings: HttpPing[],
  hours: (PingBucket | null)[],
  now: number,
  waitingLabel: string,
): HeroReading {
  const chartPings = toChartPings(pings);

  return {
    status: getStatusFromPings(chartPings),
    notice: noResponseReason(chartPings.at(-1)),
    stats: monitorStats(
      chartPings,
      uptimeStat(chartPings, bucketUptime(hours), '90h'),
    ),
    responseTimes: responseTimes(chartPings),
    checkingLabel: checkingLabel(checkIntervalLabel(chartPings)),
    lastCheckLabel: lastCheckLabel(chartPings, now) ?? waitingLabel,
  };
}

export function demoName(
  demo: Pick<AnonymousPreviewDemo, 'monitor' | 'loaded'>,
): string {
  return demo.monitor?.name ?? (demo.loaded ? PLACEHOLDER_HOST : '');
}
