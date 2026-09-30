<script lang="ts" module>
  export type MetricsColumnItem = {
    id: string;
    name: string;
    value: number;
    samples: number[];
    href?: string;
    active?: boolean;
  };
</script>

<script lang="ts">
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import LoadingLine from '$lib/domains/shared/ui/components/LoadingLine.svelte';
  import PaneHeader from '$lib/domains/shared/ui/components/PaneHeader.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    metrics: MetricsColumnItem[];
    tracked: number;
    loading?: boolean;
    onNewMetric?: () => void;
    children?: Snippet;
  };

  const {
    metrics,
    tracked,
    loading = false,
    onNewMetric,
    children,
  }: Props = $props();

  const SPARK_WIDTH = 200;
  const SPARK_HEIGHT = 36;
  const SPARK_PAD = 2;

  const integer = new Intl.NumberFormat('en-US');
  const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

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

<div class="flex w-full flex-col">
  <PaneHeader title="Metrics">
    {#if !loading}
      <span class="tabular-nums">{tracked} tracked</span>
    {/if}
  </PaneHeader>

  <div class="divide-hairline flex flex-col divide-y">
    {#if loading}
      <div class="flex h-11 items-center px-4">
        <LoadingLine label="Loading metrics" />
      </div>
    {:else}
      {#each metrics as metric (metric.id)}
        {#if metric.href}
          <!-- eslint-disable svelte/no-navigation-without-resolve -- href is supplied by the caller -->
          <a
            href={metric.href}
            class={[
              'focus-visible:outline-brand focus-visible:-outline-offset-2 focus-visible:outline-2 flex flex-col gap-2 p-4',
              metric.active
                ? 'bg-surface-100 hover:bg-surface-150'
                : 'hover:bg-surface-100',
            ]}
            aria-current={metric.active ? 'page' : undefined}
          >
            {@render tile(metric)}
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {:else}
          <div class="flex flex-col gap-2 p-4">
            {@render tile(metric)}
          </div>
        {/if}
      {:else}
        <EmptyState
          class="p-4"
          title="No metrics yet"
          description="Counters you send from your app show up here."
        />
      {/each}

      {#if onNewMetric}
        <button
          type="button"
          class="text-neutral-500 hover:bg-surface-100 focus-visible:outline-brand focus-visible:-outline-offset-2 focus-visible:outline-2 flex h-11 cursor-pointer items-center gap-2 px-4 text-left text-sm"
          onclick={onNewMetric}
        >
          {@render newMetric()}
        </button>
      {:else}
        <div class="text-neutral-500 flex h-11 items-center gap-2 px-4 text-sm">
          {@render newMetric()}
        </div>
      {/if}

      {@render children?.()}
    {/if}
  </div>
</div>

{#snippet tile(metric: MetricsColumnItem)}
  <div class="flex min-w-0 flex-col gap-0.5">
    <span
      class={[
        'truncate text-xs',
        metric.active ? 'text-neutral-300' : 'text-neutral-500',
      ]}
    >
      {metric.name}
    </span>
    <span class="font-figure truncate text-2xl">
      {format(metric.value)}
    </span>
  </div>

  <svg
    class={[
      'h-9 w-full',
      metric.active ? 'text-neutral-400' : 'text-neutral-500',
    ]}
    viewBox="0 0 {SPARK_WIDTH} {SPARK_HEIGHT}"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    {#if metric.samples.length > 1}
      <path
        d={sparkPath(metric.samples)}
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    {/if}
  </svg>
{/snippet}

{#snippet newMetric()}
  <PlusIcon class="size-4 shrink-0 text-neutral-600" />
  <span>New metric</span>
{/snippet}
