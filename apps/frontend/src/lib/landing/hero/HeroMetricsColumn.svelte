<script lang="ts">
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { scheduleJittered } from '$lib/landing/live-feed';

  type MetricKey = 'users' | 'checkouts' | 'signups' | 'errorRate';

  type Metric = {
    key: MetricKey;
    name: string;
    format(value: number): string;
    /** The next sample, given the one on screen. */
    next(value: number): number;
  };

  const MIN_TICK_MS = 1_800;
  const MAX_TICK_MS = 4_200;
  const SPARK_WIDTH = 200;
  const SPARK_HEIGHT = 36;
  const SPARK_PAD = 2;

  const integer = new Intl.NumberFormat('en-US');

  const METRICS: Metric[] = [
    {
      key: 'users',
      name: 'Active users',
      format: (value) => integer.format(value),
      next: (value) => clamp(value + between(-5, 7), 2_400, 3_400),
    },
    {
      key: 'checkouts',
      name: 'Checkouts today',
      format: (value) => integer.format(value),
      next: (value) => value + (Math.random() < 0.45 ? 1 : 0),
    },
    {
      key: 'signups',
      name: 'Sign-ups today',
      format: (value) => integer.format(value),
      next: (value) => value + (Math.random() < 0.3 ? 1 : 0),
    },
    {
      key: 'errorRate',
      name: 'Error rate',
      format: (value) => `${value.toFixed(2)}%`,
      next: (value) => clamp(value + (Math.random() - 0.5) * 0.08, 0.08, 0.9),
    },
  ];

  /** The last hour of each metric, oldest first. The newest sample is the value on screen. */
  const SEED: Record<MetricKey, number[]> = {
    users: [
      2_611, 2_640, 2_598, 2_655, 2_702, 2_688, 2_731, 2_764, 2_749, 2_790,
      2_812, 2_798, 2_835, 2_861, 2_847, 2_880, 2_902, 2_876, 2_911, 2_934,
      2_918, 2_957, 2_940, 2_963,
    ],
    checkouts: [
      96, 99, 103, 108, 110, 114, 117, 121, 124, 128, 131, 133, 137, 140, 142,
      145, 149, 152, 154, 157, 160, 163, 165, 168,
    ],
    signups: [
      12, 13, 13, 15, 17, 18, 18, 20, 22, 23, 25, 25, 27, 29, 30, 31, 33, 34,
      36, 37, 37, 39, 40, 41,
    ],
    errorRate: [
      0.42, 0.38, 0.35, 0.4, 0.31, 0.29, 0.33, 0.27, 0.3, 0.26, 0.24, 0.28,
      0.22, 0.25, 0.21, 0.19, 0.23, 0.2, 0.18, 0.22, 0.17, 0.19, 0.16, 0.18,
    ],
  };

  let series = $state<Record<MetricKey, number[]>>(structuredClone(SEED));

  $effect(() => scheduleJittered(tick, MIN_TICK_MS, MAX_TICK_MS));

  /** One metric moves per tick, the way separate counters land at their own pace. */
  function tick(): void {
    const metric = METRICS[Math.floor(Math.random() * METRICS.length)];
    const samples = series[metric.key];

    series[metric.key] = [
      ...samples.slice(1),
      metric.next(samples[samples.length - 1]),
    ];
  }

  function between(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function sparkPath(samples: number[]): string {
    const min = Math.min(...samples);
    const span = Math.max(...samples) - min || 1;
    const step = SPARK_WIDTH / (samples.length - 1);
    const inner = SPARK_HEIGHT - SPARK_PAD * 2;

    return samples
      .map((value, index) => {
        const x = (index * step).toFixed(1);
        const y = (
          SPARK_HEIGHT -
          SPARK_PAD -
          ((value - min) / span) * inner
        ).toFixed(1);

        return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join(' ');
  }
</script>

<!-- The metrics column of a service page: one tile per metric, then the row that adds another. -->
<div class="flex h-full w-full flex-col" aria-hidden="true">
  <div class="border-hairline flex h-11 shrink-0 items-center border-b px-4">
    <span class="text-neutral-500 text-xs">Metrics</span>
    <span class="text-neutral-500 ml-auto text-xs tabular-nums">
      {METRICS.length} tracked
    </span>
  </div>

  <div class="divide-hairline flex min-h-0 flex-col divide-y overflow-hidden">
    {#each METRICS as metric (metric.key)}
      {@const samples = series[metric.key]}

      <div class="flex shrink-0 flex-col gap-2 px-4 py-4">
        <div class="flex flex-col gap-0.5">
          <span class="text-neutral-500 text-xs">{metric.name}</span>
          <span class="text-2xl font-medium tabular-nums">
            {metric.format(samples[samples.length - 1])}
          </span>
        </div>

        <svg
          class="text-neutral-500 h-9 w-full"
          viewBox="0 0 {SPARK_WIDTH} {SPARK_HEIGHT}"
          preserveAspectRatio="none"
        >
          <path
            d={sparkPath(samples)}
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
    {/each}

    <div
      class="text-neutral-500 flex h-11 shrink-0 items-center gap-2 px-4 text-sm"
    >
      <PlusIcon class="size-4 shrink-0 text-neutral-600" />
      <span>New metric</span>
    </div>
  </div>
</div>
