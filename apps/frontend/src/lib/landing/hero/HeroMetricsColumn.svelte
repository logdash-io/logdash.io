<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { showsVisitorAccount } from './hero-showcase';

  const SPARK_WIDTH = 200;
  const SPARK_HEIGHT = 36;
  const SPARK_PAD = 2;
  const SKELETON_TILES = 4;

  const integer = new Intl.NumberFormat('en-US');
  const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

  const visitorAccount = $derived(
    showsVisitorAccount(anonymousPreviewState.phase),
  );
  const metrics = $derived(
    visitorAccount ? [] : anonymousPreviewState.demo.metrics,
  );
  const tracked = $derived(
    visitorAccount ? 0 : anonymousPreviewState.demo.metricsTracked,
  );

  function format(value: number): string {
    return Number.isInteger(value)
      ? integer.format(value)
      : decimal.format(value);
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
    {#if metrics}
      <span class="text-neutral-500 ml-auto text-xs tabular-nums">
        {tracked} tracked
      </span>
    {/if}
  </div>

  <div class="divide-hairline flex min-h-0 flex-col divide-y overflow-hidden">
    {#if visitorAccount}
      <div class="flex shrink-0 flex-col gap-1 px-4 py-4">
        <span class="text-sm">No metrics yet</span>
        <span class="text-neutral-500 text-sm">
          Counters you send from your app show up here.
        </span>
      </div>
    {:else if metrics}
      {#each metrics as metric (metric.id)}
        {@const samples = [...metric.history, metric.value]}

        <div class="flex shrink-0 flex-col gap-2 px-4 py-4">
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="text-neutral-500 truncate text-xs">{metric.name}</span>
            <span class="truncate text-2xl font-medium tabular-nums">
              {format(metric.value)}
            </span>
          </div>

          <svg
            class="text-neutral-500 h-9 w-full"
            viewBox="0 0 {SPARK_WIDTH} {SPARK_HEIGHT}"
            preserveAspectRatio="none"
          >
            {#if samples.length > 1}
              <path
                d={sparkPath(samples)}
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
            {/if}
          </svg>
        </div>
      {/each}
    {:else}
      {#each [...Array(SKELETON_TILES).keys()] as index (index)}
        <div class="flex shrink-0 flex-col gap-2 px-4 py-4">
          <div class="bg-neutral-800 h-3 w-24 animate-pulse rounded"></div>
          <div class="bg-neutral-800 h-7 w-32 animate-pulse rounded"></div>
          <div class="bg-neutral-800 h-9 w-full animate-pulse rounded"></div>
        </div>
      {/each}
    {/if}

    <div
      class="text-neutral-500 flex h-11 shrink-0 items-center gap-2 px-4 text-sm"
    >
      <PlusIcon class="size-4 shrink-0 text-neutral-600" />
      <span>New metric</span>
    </div>
  </div>
</div>
