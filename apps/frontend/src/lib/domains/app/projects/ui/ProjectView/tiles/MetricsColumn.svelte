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
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
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
  const TILE_CLASS = 'flex min-w-0 flex-col gap-1.5 rounded-lg p-3';

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

<Well
  label="Metrics"
  title="Metrics"
  class="@container min-h-0 flex-1 overflow-y-auto"
  actions={loading ? undefined : count}
>
  {#if loading}
    <div class="grid gap-2" role="status" aria-label="Loading metrics">
      {#each ['w-24', 'w-32', 'w-20'] as width (width)}
        <div class={TILE_CLASS} aria-hidden="true">
          <span class={['bg-surface-150-bg h-4 rounded-md', width]}></span>
          <span class="bg-surface-150-bg h-8 w-16 rounded-md"></span>
          <span class="h-9"></span>
        </div>
      {/each}
    </div>
  {:else}
    {#if metrics.length}
      <div class="grid gap-2 @md:grid-cols-2 @3xl:grid-cols-4">
        {#each metrics as metric (metric.id)}
          {#if metric.href}
            <!-- eslint-disable svelte/no-navigation-without-resolve -- href is supplied by the caller -->
            <a
              href={metric.href}
              class={[
                TILE_CLASS,
                'focus-visible:outline-brand focus-visible:outline-2 focus-visible:-outline-offset-2',
                metric.active
                  ? 'bg-surface-25-selected-bg'
                  : 'hover:bg-surface-25-hover-bg',
              ]}
              aria-current={metric.active ? 'page' : undefined}
            >
              {@render tile(metric)}
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {:else}
            <div class={TILE_CLASS}>
              {@render tile(metric)}
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div
        class="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
      >
        <p class="font-medium">No metrics yet</p>
        <p class="text-fg-tertiary max-w-sm text-sm text-balance">
          Counters you send from your app show up here.
        </p>
      </div>
    {/if}

    {#if onNewMetric}
      <button
        type="button"
        class="text-fg-muted hover:bg-surface-25-hover-bg hover:text-fg-default transition-ink focus-visible:outline-brand flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2"
        onclick={onNewMetric}
      >
        {@render newMetric()}
      </button>
    {:else}
      <div class="text-fg-muted flex h-9 items-center gap-2 px-3 text-sm">
        {@render newMetric()}
      </div>
    {/if}

    {@render children?.()}
  {/if}
</Well>

{#snippet count()}
  <span class="text-fg-muted px-3 text-xs tabular-nums">{tracked} tracked</span>
{/snippet}

{#snippet tile(metric: MetricsColumnItem)}
  <span
    class={[
      'truncate text-xs',
      metric.active ? 'text-fg-default' : 'text-fg-muted',
    ]}
  >
    {metric.name}
  </span>
  <span class="truncate font-mono text-2xl tabular-nums">
    {format(metric.value)}
  </span>

  <svg
    class={['h-9 w-full', metric.active ? 'text-fg-tertiary' : 'text-fg-muted']}
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
  <PlusIcon class="text-fg-faint size-4 shrink-0" />
  <span>New metric</span>
{/snippet}
