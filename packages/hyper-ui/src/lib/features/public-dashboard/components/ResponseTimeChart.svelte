<script lang="ts">
  import type { Ping } from "@logdash/status";
  import { isHealthyStatus } from "../utils/group-pings-by-status";

  interface Props {
    pings: Ping[];
    label: string;
  }

  type Run = { failed: boolean; from: number; to: number };

  let { pings, label }: Props = $props();

  const id = $props.id();
  const WIDTH = 240;
  const HEIGHT = 64;

  const step = $derived(WIDTH / Math.max(1, pings.length - 1));
  const maxMs = $derived(
    Math.max(
      1,
      ...pings
        .filter((ping) => isHealthyStatus(ping.statusCode))
        .map((ping) => ping.responseTimeMs)
    ) * 1.15
  );
  const runs = $derived(splitRuns(pings));
  const healthyRuns = $derived(runs.filter((run) => !run.failed));
  const failedRuns = $derived(runs.filter((run) => run.failed));
  const linePath = $derived(
    healthyRuns
      .map((run) => toPoints(run))
      .map((points) => `M${[...points, points[points.length - 1]].join(" L")}`)
      .join(" ")
  );
  const areaPath = $derived(
    healthyRuns
      .map(
        (run) =>
          `M${toX(run.from)},${HEIGHT} L${toPoints(run).join(" L")} L${toX(run.to)},${HEIGHT} Z`
      )
      .join(" ")
  );

  function splitRuns(pings: Ping[]): Run[] {
    return pings.reduce<Run[]>((runs, ping, index) => {
      const failed = !isHealthyStatus(ping.statusCode);
      const last = runs[runs.length - 1];

      if (last?.failed === failed) {
        last.to = index;

        return runs;
      }

      return [...runs, { failed, from: index, to: index }];
    }, []);
  }

  function toPoints(run: Run): string[] {
    return pings
      .slice(run.from, run.to + 1)
      .map(
        (ping, offset) =>
          `${toX(run.from + offset)},${toY(ping.responseTimeMs)}`
      );
  }

  function toX(index: number): number {
    return Number((index * step).toFixed(2));
  }

  function toY(responseMs: number): number {
    return Number(
      (HEIGHT - (Math.min(responseMs, maxMs) / maxMs) * (HEIGHT - 8) - 4).toFixed(2)
    );
  }
</script>

{#if pings.length > 1}
  <svg
    class="block h-16 w-full"
    viewBox="0 0 {WIDTH} {HEIGHT}"
    preserveAspectRatio="none"
    role="img"
    aria-label="{label} response time over the last {pings.length} checks{failedRuns.length
      ? ', failed checks marked in red'
      : ''}"
  >
    <defs>
      <linearGradient id="{id}-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-brand)" stop-opacity="0.22" />
        <stop offset="100%" stop-color="var(--color-brand)" stop-opacity="0" />
      </linearGradient>

      <linearGradient id="{id}-failed-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-error)" stop-opacity="0" />
        <stop offset="100%" stop-color="var(--color-error)" stop-opacity="0.32" />
      </linearGradient>
    </defs>

    <path d={areaPath} fill="url(#{id}-fill)" />
    <path
      d={linePath}
      fill="none"
      stroke="var(--color-brand)"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />

    {#each failedRuns as run (run.from)}
      <rect
        x={toX(run.from - 1)}
        y="0"
        width={toX(run.to - run.from + 2)}
        height={HEIGHT}
        fill="url(#{id}-failed-fill)"
      />
      <path
        d="M{toX(run.from - 1)},{HEIGHT - 1} H{toX(run.to + 1)}"
        stroke="var(--color-error)"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
      />
    {/each}
  </svg>

  <div
    class="text-fg-muted mt-2 flex items-center justify-between font-mono text-xs"
  >
    <span>{pings.length} checks ago</span>
    <span>Now</span>
  </div>
{:else}
  <div
    class="border-surface-root-border text-fg-muted flex h-16 items-center justify-center border-y border-dashed text-xs"
  >
    {pings.length ? "Waiting for more checks" : "No checks yet"}
  </div>
{/if}
