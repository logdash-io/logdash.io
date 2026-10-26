<script lang="ts">
  import RollingNumber from '$lib/domains/shared/ui/components/RollingNumber.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import {
    formatInterval,
    formatRate,
    type CountVerdict,
    type RateVerdict,
  } from '../../domain/day-analytics';
  import Flag from './Flag.svelte';

  type Props = {
    label: string;
    hint: string;
    verdict: CountVerdict | RateVerdict;
    typical: string;
    by: string;
    weekdays: string;
    reached?: string;
    unit?: string;
    goal?: boolean;
    loading: boolean;
  };

  const {
    label,
    hint,
    verdict,
    typical,
    by,
    weekdays,
    reached,
    unit,
    goal = false,
    loading,
  }: Props = $props();

  const rate = $derived('rate' in verdict ? verdict : null);
  const count = $derived('value' in verdict ? verdict.value : 0);
</script>

<div class="flex min-w-0 flex-col gap-1.5 rounded-lg p-3">
  <dt
    class="text-fg-muted flex min-h-5 items-center justify-between gap-2 text-xs"
  >
    <Tooltip content={hintBox} placement="top" align="left" class="min-w-0">
      <span
        class={[
          'decoration-fg-faint truncate underline decoration-dotted underline-offset-4',
          { 'font-mono': goal },
        ]}
      >
        {label}
      </span>
    </Tooltip>
    {#if !loading}
      <Flag {label} {verdict} {by} {weekdays} {reached} {unit} />
    {/if}
  </dt>
  <dd class="flex min-h-8 min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
    {#if loading}
      <span class="bg-surface-150-bg block h-8 w-16 rounded-md"></span>
    {:else}
      <RollingNumber
        value={rate ? rate.hits : count}
        class="font-mono text-2xl leading-8"
        durationMs={1100}
      />
      {#if rate}
        <span class="text-fg-secondary text-sm whitespace-nowrap tabular-nums">
          {formatRate(rate.rate)}
          <span class="text-fg-muted text-xs">
            ({formatInterval(rate.interval)})
          </span>
        </span>
      {/if}
    {/if}
  </dd>
  <dd class="text-fg-muted h-4 truncate text-xs tabular-nums">
    {loading ? '' : typical}
  </dd>
</div>

{#snippet hintBox()}
  <p
    class="bg-surface-elevated-bg edge text-fg-secondary max-w-72 rounded-lg px-3 py-2 text-xs leading-5 whitespace-normal shadow"
  >
    {hint}
  </p>
{/snippet}
