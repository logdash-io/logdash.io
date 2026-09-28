'use client';

import {
  StatusPageError,
  type Bucket,
  type Monitor,
  type StatusPage as StatusPageData,
  type StatusPageOptions,
} from '@logdash/status';
import { useStatusPage } from '@logdash/status/react';
import {
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

type Status = { label: string; dot: string };
type DayStatus = 'up' | 'degraded' | 'down' | 'none';

const PAGE_STATUS: Record<StatusPageData['status'], Status> = {
  operational: { label: 'All systems operational', dot: 'bg-green-600' },
  degraded: { label: 'Partial outage', dot: 'bg-amber-500' },
  outage: { label: 'Major outage', dot: 'bg-red-600' },
  unknown: { label: 'Status unknown', dot: 'bg-muted-foreground' },
};

const MONITOR_STATUS: Record<Monitor['status'], Status> = {
  up: { label: 'Operational', dot: 'bg-green-600' },
  degraded: { label: 'Degraded', dot: 'bg-amber-500' },
  down: { label: 'Down', dot: 'bg-red-600' },
  unknown: { label: 'Unknown', dot: 'bg-muted-foreground' },
};

const DAY_BAR: Record<DayStatus, string> = {
  up: 'bg-muted-foreground/40 hover:bg-muted-foreground focus-visible:bg-muted-foreground',
  degraded: 'bg-amber-500',
  down: 'bg-red-600',
  none: 'bg-muted-foreground/15 hover:bg-muted-foreground/40 focus-visible:bg-muted-foreground/40',
};

const UPTIME_WINDOWS = [
  ['24h', '24 hours'],
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['90d', '90 days'],
] as const;

const DATE = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export type StatusPageProps = StatusPageOptions & {
  statusPageId: string;
  className?: string;
};

export function StatusPage({
  statusPageId,
  baseUrl,
  pollInterval,
  initialData,
  className,
}: StatusPageProps) {
  const { data, error } = useStatusPage(statusPageId, {
    baseUrl,
    pollInterval,
    initialData,
  });

  if (data) {
    return <StatusPageView page={data} className={className} />;
  }

  return (
    <div className={className}>
      {error ? <StatusUnavailable error={error} /> : <StatusPageSkeleton />}
    </div>
  );
}

export function StatusPageView({
  page,
  className,
}: {
  page: StatusPageData;
  className?: string;
}) {
  return (
    <div className={`text-foreground ${className ?? ''}`}>
      <StatusBanner page={page} />

      {page.monitors.length ? (
        <ul className="border-border mt-8 border-t">
          {page.monitors.map((monitor) => (
            <li key={monitor.id} className="border-border border-b py-6">
              <MonitorRow monitor={monitor} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-8 text-sm">
          No monitors on this page yet.
        </p>
      )}
    </div>
  );
}

export function StatusBanner({ page }: { page: StatusPageData }) {
  const status = PAGE_STATUS[page.status];

  return (
    <header className="flex flex-col gap-1">
      <h2 className="text-muted-foreground text-sm">{page.name}</h2>
      <p className="flex items-center gap-3 text-2xl font-medium tracking-tight sm:text-3xl">
        <span
          aria-hidden="true"
          className={`size-2.5 shrink-0 rounded-full ${status.dot}`}
        />
        {status.label}
      </p>
      <UpdatedAgo updatedAt={page.updatedAt} />
    </header>
  );
}

export function MonitorRow({ monitor }: { monitor: Monitor }) {
  const status = MONITOR_STATUS[monitor.status];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="min-w-0 truncate font-medium">{monitor.name}</h3>
        <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${status.dot}`}
          />
          {status.label}
        </span>
      </div>

      <dl className="grid grid-cols-4 gap-4 sm:max-w-md">
        {UPTIME_WINDOWS.map(([window, label]) => (
          <div key={window} className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd
              className={`text-sm tabular-nums ${monitor.uptime[window] === null ? 'text-muted-foreground' : ''}`}
            >
              {formatUptime(monitor.uptime[window])}
            </dd>
          </div>
        ))}
      </dl>

      <DailyBars
        days={monitor.history.daily}
        label={`${monitor.name}, daily uptime for the last 90 days`}
      />
    </div>
  );
}

export function DailyBars({ days, label }: { days: Bucket[]; label: string }) {
  return (
    <div>
      <div
        role="grid"
        tabIndex={-1}
        aria-label={label}
        className="relative outline-none"
        onKeyDown={onBarsKeyDown}
        onFocus={onBarsFocus}
      >
        <div role="row" className="flex h-8 gap-px sm:gap-0.5">
          {days.map((day, index) => (
            <div
              key={day.timestamp}
              role="gridcell"
              tabIndex={index === days.length - 1 ? 0 : -1}
              aria-label={describeDay(day)}
              className={`group focus-visible:ring-ring focus-visible:ring-offset-background min-w-0 flex-1 rounded-[1px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${DAY_BAR[dayStatus(day)]}`}
            >
              <DayTooltip day={day} left={tooltipLeft(index, days.length)} />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="text-muted-foreground mt-2 flex justify-between font-mono text-xs"
      >
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function DayTooltip({ day, left }: { day: Bucket; left: string }) {
  const checks = day.successCount + day.failureCount;

  return (
    <div
      aria-hidden="true"
      style={{ left }}
      className="border-border bg-popover text-popover-foreground pointer-events-none absolute bottom-full z-10 mb-2 hidden w-44 rounded-md border p-3 text-xs shadow-md group-hover:block group-focus-visible:block"
    >
      <p className="font-medium">
        {DATE.format(new Date(day.timestamp))}{' '}
        <span className="text-muted-foreground font-normal">UTC</span>
      </p>
      {checks ? (
        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 tabular-nums">
          <dt className="text-muted-foreground">Uptime</dt>
          <dd className="text-right">
            {formatUptime((day.successCount / checks) * 100)}
          </dd>
          <dt className="text-muted-foreground">Checks</dt>
          <dd className="text-right">{checks.toLocaleString('en-US')}</dd>
          {day.averageLatencyMs !== null && (
            <>
              <dt className="text-muted-foreground">Avg response</dt>
              <dd className="text-right">
                {Math.round(day.averageLatencyMs)} ms
              </dd>
            </>
          )}
        </dl>
      ) : (
        <p className="text-muted-foreground mt-1">No checks this day</p>
      )}
    </div>
  );
}

function UpdatedAgo({ updatedAt }: { updatedAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <time
      dateTime={updatedAt}
      className="text-muted-foreground min-h-5 text-sm"
    >
      {now === null ? '' : `Updated ${formatAge(updatedAt, now)}`}
    </time>
  );
}

function StatusUnavailable({ error }: { error: Error }) {
  return (
    <div role="alert" className="flex flex-col gap-1">
      <p className="flex items-center gap-3 text-2xl font-medium tracking-tight sm:text-3xl">
        <span
          aria-hidden="true"
          className="bg-muted-foreground size-2.5 shrink-0 rounded-full"
        />
        Status unavailable
      </p>
      <p className="text-muted-foreground text-sm">{describeError(error)}</p>
    </div>
  );
}

function StatusPageSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex animate-pulse flex-col motion-reduce:animate-none"
    >
      <span className="sr-only">Loading status</span>
      <div className="bg-muted h-4 w-24 rounded-sm" />
      <div className="bg-muted mt-3 h-8 w-72 max-w-full rounded-sm" />
      <div className="border-border mt-10 border-t">
        {[0, 1].map((row) => (
          <div key={row} className="border-border border-b py-6">
            <div className="bg-muted h-4 w-32 rounded-sm" />
            <div className="bg-muted mt-6 h-8 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function onBarsKeyDown(event: KeyboardEvent<HTMLElement>) {
  const cells = gridCells(event.currentTarget);
  const from = cells.indexOf(event.target as HTMLElement);
  const to = {
    ArrowLeft: from - 1,
    ArrowRight: from + 1,
    Home: 0,
    End: cells.length - 1,
  }[event.key];

  if (to === undefined || !cells[to]) return;
  event.preventDefault();
  cells[to].focus();
}

function onBarsFocus(event: FocusEvent<HTMLElement>) {
  const cells = gridCells(event.currentTarget);
  if (!cells.includes(event.target as HTMLElement)) return;
  for (const cell of cells) {
    cell.tabIndex = cell === event.target ? 0 : -1;
  }
}

function gridCells(grid: HTMLElement): HTMLElement[] {
  return Array.from(grid.querySelectorAll<HTMLElement>('[role="gridcell"]'));
}

function dayStatus(day: Bucket): DayStatus {
  const checks = day.successCount + day.failureCount;
  if (!checks) return 'none';
  const uptime = day.successCount / checks;
  if (uptime < 0.5) return 'down';
  return uptime < 0.999 ? 'degraded' : 'up';
}

function describeDay(day: Bucket): string {
  const date = DATE.format(new Date(day.timestamp));
  const checks = day.successCount + day.failureCount;
  if (!checks) return `${date}: no checks`;

  const uptime = formatUptime((day.successCount / checks) * 100);
  const latency =
    day.averageLatencyMs === null
      ? ''
      : `, ${Math.round(day.averageLatencyMs)} ms average response`;
  return `${date}: ${uptime} uptime, ${checks.toLocaleString('en-US')} checks${latency}`;
}

function tooltipLeft(index: number, count: number): string {
  const center = ((index + 0.5) / count) * 100;
  return `clamp(0px, calc(${center}% - 5.5rem), calc(100% - 11rem))`;
}

function formatUptime(percent: number | null): string {
  if (percent === null) return 'No data';
  if (percent >= 100) return '100%';
  return `${(Math.floor(percent * 100 + 1e-6) / 100).toFixed(2)}%`;
}

function formatAge(from: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(from)) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

function describeError(error: Error): string {
  if (error instanceof StatusPageError && error.status === 404) {
    return 'This status page does not exist. Check the status page ID.';
  }
  if (error instanceof StatusPageError && error.status === 403) {
    return 'This status page is not public.';
  }
  return 'Could not reach the status API. Trying again shortly.';
}
