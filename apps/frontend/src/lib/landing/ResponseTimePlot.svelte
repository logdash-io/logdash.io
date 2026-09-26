<svelte:options namespace="svg" />

<script lang="ts">
  type Props = {
    responseTimes: number[];
    step: number;
    height: number;
    maxMs: number;
  };

  type Run = { down: boolean; from: number; to: number };

  const { responseTimes, step, height, maxMs }: Props = $props();

  const id = $props.id();

  const runs = $derived(splitRuns(responseTimes));
  const upRuns = $derived(runs.filter((run) => !run.down));
  const downRuns = $derived(runs.filter((run) => run.down));
  const linePath = $derived(
    upRuns.map((run) => `M${toPoints(run).join(' L')}`).join(' '),
  );
  const areaPath = $derived(
    upRuns
      .map(
        (run) =>
          `M${toX(run.from)},${height} L${toPoints(run).join(' L')} L${toX(run.to)},${height} Z`,
      )
      .join(' '),
  );

  function splitRuns(responseTimes: number[]): Run[] {
    return responseTimes.reduce<Run[]>((runs, responseMs, index) => {
      const down = responseMs === 0;
      const last = runs[runs.length - 1];

      if (last?.down === down) {
        last.to = index;

        return runs;
      }

      return [...runs, { down, from: index, to: index }];
    }, []);
  }

  function toPoints(run: Run): string[] {
    return responseTimes
      .slice(run.from, run.to + 1)
      .map(
        (responseMs, offset) => `${toX(run.from + offset)},${toY(responseMs)}`,
      );
  }

  function toX(index: number): number {
    return Number((index * step).toFixed(2));
  }

  function toY(responseMs: number): number {
    return Number(
      (
        height -
        (Math.min(responseMs, maxMs) / maxMs) * (height - 8) -
        4
      ).toFixed(2),
    );
  }
</script>

<defs>
  <linearGradient id="{id}-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="var(--color-brand)" stop-opacity="0.28" />
    <stop offset="100%" stop-color="var(--color-brand)" stop-opacity="0" />
  </linearGradient>

  <linearGradient id="{id}-down-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="var(--color-error)" stop-opacity="0" />
    <stop offset="100%" stop-color="var(--color-error)" stop-opacity="0.28" />
  </linearGradient>
</defs>

<path d={areaPath} fill="url(#{id}-fill)" />
<path
  d={linePath}
  fill="none"
  stroke="var(--color-brand)"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  vector-effect="non-scaling-stroke"
/>

{#each downRuns as run (run.from)}
  <rect
    x={toX(run.from - 1)}
    y="0"
    width={toX(run.to - run.from + 2)}
    height={toY(0)}
    fill="url(#{id}-down-fill)"
  />
  <path
    d="M{toX(run.from - 1)},{toY(0)} H{toX(run.to + 1)}"
    stroke="var(--color-error)"
    stroke-width="2"
    stroke-linecap="round"
    vector-effect="non-scaling-stroke"
  />
{/each}
