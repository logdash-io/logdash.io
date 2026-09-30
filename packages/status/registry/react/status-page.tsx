'use client';

import {
  StatusPageError,
  type Bucket,
  type Monitor,
  type StatusPage as StatusPageData,
  type StatusPageOptions,
} from '@logdash/status';
import { useStatusPage } from '@logdash/status/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

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
  up: 'bg-muted-foreground/40 data-[open]:bg-muted-foreground',
  degraded: 'bg-amber-500',
  down: 'bg-red-600',
  none: 'bg-muted-foreground/15 data-[open]:bg-muted-foreground/40',
};

const DAY_DOT: Record<DayStatus, string> = {
  up: 'bg-green-600',
  degraded: 'bg-amber-500',
  down: 'bg-red-600',
  none: 'bg-muted-foreground',
};

const UPTIME_WINDOWS = [
  ['24h', '24 h uptime'],
  ['7d', '7 d uptime'],
  ['30d', '30 d uptime'],
  ['90d', '90 d uptime'],
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
    <div className={`text-foreground ${className ?? ''}`}>
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
        <ul className="border-border mt-12 border-t sm:mt-16">
          {page.monitors.map((monitor) => (
            <li
              key={monitor.id}
              className="border-border border-b py-10 sm:py-12"
            >
              <MonitorRow monitor={monitor} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-border text-muted-foreground mt-12 border-t pt-10 text-sm sm:mt-16">
          No monitors on this page yet.
        </p>
      )}
    </div>
  );
}

export function StatusBanner({ page }: { page: StatusPageData }) {
  const status = PAGE_STATUS[page.status];

  return (
    <header>
      <h2 className="text-muted-foreground mb-3 text-base break-words">
        {page.name}
      </h2>
      <Headline dot={status.dot}>{status.label}</Headline>
      <UpdatedAgo updatedAt={page.updatedAt} />
    </header>
  );
}

export function MonitorRow({ monitor }: { monitor: Monitor }) {
  const status = MONITOR_STATUS[monitor.status];

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h3 className="min-w-0 text-lg font-medium tracking-[-0.01em] break-words">
          {monitor.name}
        </h3>
        <span className="text-muted-foreground flex h-7 shrink-0 items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${status.dot}`}
          />
          {status.label}
        </span>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
        {UPTIME_WINDOWS.map(([window, label]) => (
          <div key={window} className="flex min-w-0 flex-col gap-1">
            <dt className="text-muted-foreground truncate text-xs">{label}</dt>
            <dd
              className={`truncate text-base font-medium tabular-nums sm:text-lg ${monitor.uptime[window] === null ? 'text-muted-foreground' : ''}`}
            >
              {formatUptime(monitor.uptime[window])}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <DailyBars days={monitor.history.daily} label={monitor.name} />
      </div>
    </div>
  );
}

export function DailyBars({ days, label }: { days: Bucket[]; label: string }) {
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => (grid.current ? barsTooltip(grid.current) : undefined), []);

  return (
    <div>
      <div
        ref={grid}
        role="grid"
        aria-label={`${label}, daily uptime over the last ${days.length} days (UTC)`}
        className="relative"
      >
        <div role="row" className="flex h-8 gap-px sm:gap-0.5">
          {days.map((day, index) => (
            <div
              key={day.timestamp}
              role="gridcell"
              tabIndex={index === days.length - 1 ? 0 : -1}
              aria-label={describeDay(day)}
              className={`group focus-visible:outline-ring min-w-0 flex-1 rounded-[1px] focus-visible:outline-2 focus-visible:outline-offset-2 data-[open]:-my-1 ${DAY_BAR[dayStatus(day)]}`}
            >
              <DayTooltip day={day} at={((index + 0.5) / days.length) * 100} />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="text-muted-foreground mt-2 flex justify-between font-mono text-xs"
      >
        <span>{days.length} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

/**
 * `at` is the bar's centre in percent of the row. The tooltip slides by the same
 * share of its own width, so it stays over its bar and never leaves the row.
 */
function DayTooltip({ day, at }: { day: Bucket; at: number }) {
  const checks = checksOf(day);

  return (
    <div
      aria-hidden="true"
      style={{ left: `${at}%`, translate: `-${at}% 0` }}
      className="border-border bg-popover text-popover-foreground pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max max-w-full flex-col gap-1 rounded-md border px-3 py-2.5 shadow-md group-data-[open]:flex"
    >
      <p className="text-sm font-medium">
        {DATE.format(new Date(day.timestamp))}{' '}
        <span className="text-muted-foreground font-mono text-xs font-normal">
          UTC
        </span>
      </p>
      {checks ? (
        <>
          <p className="flex items-center gap-2 text-xs tabular-nums">
            <span
              className={`size-1.5 shrink-0 rounded-full ${DAY_DOT[dayStatus(day)]}`}
            />
            {formatUptime((day.successCount / checks) * 100)} uptime
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {describeChecks(day, ' · ')}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-xs">No checks this day</p>
      )}
    </div>
  );
}

function Headline({ dot, children }: { dot: string; children: ReactNode }) {
  return (
    <p className="flex items-start gap-3 text-3xl leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
      <span
        aria-hidden="true"
        className="flex h-[1.15em] shrink-0 items-center"
      >
        <span className={`size-2.5 rounded-full ${dot}`} />
      </span>
      {children}
    </p>
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
      className="text-muted-foreground mt-4 block min-h-5 text-sm tabular-nums"
    >
      {now === null ? '' : `Updated ${formatAge(updatedAt, now)}`}
    </time>
  );
}

function StatusUnavailable({ error }: { error: Error }) {
  return (
    <div role="alert">
      <Headline dot="bg-muted-foreground">Status unavailable</Headline>
      <p className="text-muted-foreground mt-4 text-sm">
        {describeError(error)}
      </p>
    </div>
  );
}

function StatusPageSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse motion-reduce:animate-none">
      <span className="sr-only">Loading status</span>
      <div className="bg-muted h-5 w-24 rounded-sm" />
      <div className="bg-muted mt-4 h-8 w-72 max-w-full rounded-sm sm:h-9" />
      <div className="bg-muted mt-5 h-4 w-28 rounded-sm" />
      <div className="border-border mt-12 border-t sm:mt-16">
        {[0, 1].map((row) => (
          <div key={row} className="border-border border-b py-10 sm:py-12">
            <div className="bg-muted h-6 w-32 rounded-sm" />
            <div className="bg-muted mt-6 h-26 rounded-sm sm:h-12" />
            <div className="bg-muted mt-5 h-8 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * One tooltip at a time for the bar under the pointer or with focus, whichever
 * moved last. Escape hides it, arrow keys, Home and End move between days, and
 * the grid keeps a single tab stop. Touch shows it through focus on tap.
 */
function barsTooltip(grid: HTMLElement): () => void {
  let hovered: HTMLElement | null = null;
  let focused: HTMLElement | null = null;

  const cells = () =>
    Array.from(grid.querySelectorAll<HTMLElement>('[role="gridcell"]'));
  const cellOf = (target: EventTarget | null) =>
    target instanceof Element
      ? target.closest<HTMLElement>('[role="gridcell"]')
      : null;
  const show = (cell: HTMLElement | null) => {
    for (const open of grid.querySelectorAll('[data-open]')) {
      if (open !== cell) open.removeAttribute('data-open');
    }
    cell?.setAttribute('data-open', '');
  };

  const onPointerOver = (event: PointerEvent) => {
    const cell = cellOf(event.target);
    if (event.pointerType === 'touch' || !cell || cell === hovered) return;
    hovered = cell;
    show(cell);
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    hovered = null;
    show(focused);
  };
  const onFocusIn = (event: FocusEvent) => {
    const cell = cellOf(event.target);
    if (!cell) return;
    focused = cell;
    for (const other of cells()) other.tabIndex = other === cell ? 0 : -1;
    show(cell);
  };
  const onFocusOut = (event: FocusEvent) => {
    if (grid.contains(event.relatedTarget as Node | null)) return;
    focused = null;
    show(hovered);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const all = cells();
    const from = all.indexOf(event.target as HTMLElement);
    const to = {
      ArrowLeft: from - 1,
      ArrowRight: from + 1,
      Home: 0,
      End: all.length - 1,
    }[event.key];
    if (from === -1 || to === undefined || !all[to]) return;
    event.preventDefault();
    all[to].focus();
  };
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') show(null);
  };

  grid.addEventListener('pointerover', onPointerOver);
  grid.addEventListener('pointerleave', onPointerLeave);
  grid.addEventListener('focusin', onFocusIn);
  grid.addEventListener('focusout', onFocusOut);
  grid.addEventListener('keydown', onKeyDown);
  window.addEventListener('keydown', onEscape);

  return () => {
    grid.removeEventListener('pointerover', onPointerOver);
    grid.removeEventListener('pointerleave', onPointerLeave);
    grid.removeEventListener('focusin', onFocusIn);
    grid.removeEventListener('focusout', onFocusOut);
    grid.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keydown', onEscape);
  };
}

function checksOf(day: Bucket): number {
  return day.successCount + day.failureCount;
}

function dayStatus(day: Bucket): DayStatus {
  const checks = checksOf(day);
  if (!checks) return 'none';
  const uptime = day.successCount / checks;
  if (uptime < 0.5) return 'down';
  return uptime < 0.999 ? 'degraded' : 'up';
}

function describeDay(day: Bucket): string {
  const date = DATE.format(new Date(day.timestamp));
  const checks = checksOf(day);
  if (!checks) return `${date}: no checks`;

  const uptime = formatUptime((day.successCount / checks) * 100);
  return `${date}: ${uptime} uptime, ${describeChecks(day, ', ')}`;
}

function describeChecks(day: Bucket, separator: string): string {
  const checks = checksOf(day);
  const count = `${checks.toLocaleString('en-US')} ${checks === 1 ? 'check' : 'checks'}`;
  return day.averageLatencyMs === null
    ? count
    : `${count}${separator}${Math.round(day.averageLatencyMs)} ms avg`;
}

function formatUptime(percent: number | null): string {
  if (percent === null) return 'No data';
  if (percent >= 100) return '100%';
  return `${(Math.floor(percent * 100 + 1e-6) / 100).toFixed(2)}%`;
}

function formatAge(from: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(from)) / 1000));
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
