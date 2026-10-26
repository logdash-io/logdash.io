<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { formatCount } from '../../domain/analytics-format';
  import {
    countBand,
    formatInterval,
    formatRate,
    MIN_BASELINE,
    verdictLabel,
    whole,
    type CountVerdict,
    type RateVerdict,
  } from '../../domain/day-analytics';

  type Props = {
    label: string;
    verdict: CountVerdict | RateVerdict;
    by: string;
    weekdays: string;
    reached?: string;
    variant?: 'chip' | 'mark';
  };

  const {
    label,
    verdict,
    by,
    weekdays,
    reached = 'stayed',
    variant = 'chip',
  }: Props = $props();

  const rate = $derived('rate' in verdict ? verdict : null);
  const count = $derived('value' in verdict ? verdict : null);
  const band = $derived(
    count?.typical == null ? null : countBand(count.typical),
  );
  const arrow = $derived(verdict.flag > 0 ? '↑' : verdict.flag < 0 ? '↓' : '');
  const tone = $derived(
    verdict.flag > 0
      ? 'text-success-fg'
      : verdict.flag < 0
        ? 'text-error-fg'
        : 'text-fg-muted',
  );
</script>

{#if variant === 'chip'}
  <Tooltip content={explanation} placement="top" align="right">
    <span
      class={[
        'flex h-5 shrink-0 items-center gap-1 rounded-full text-xs whitespace-nowrap',
        tone,
        {
          'bg-success-bg px-2': verdict.flag > 0,
          'bg-error-bg px-2': verdict.flag < 0,
        },
      ]}
    >
      {#if arrow}<span aria-hidden="true">{arrow}</span>{/if}
      {verdictLabel(verdict.flag)}
    </span>
  </Tooltip>
{:else if verdict.flag}
  <Tooltip content={explanation} placement="top" align="right">
    <span
      class={['inline-flex w-3.5 justify-center text-xs font-semibold', tone]}
      role="img"
      aria-label={verdictLabel(verdict.flag)}
    >
      {arrow}
    </span>
  </Tooltip>
{:else}
  <span class="inline-flex w-3.5" aria-hidden="true"></span>
{/if}

{#snippet explanation()}
  <div
    class="bg-surface-elevated-bg border-surface-elevated-border w-64 rounded-xl border px-3 py-2.5 text-sm shadow-lg"
  >
    <p class="text-fg-muted text-xs">{label}</p>
    <p class="mt-1.5 flex items-center justify-between gap-4">
      <span>
        {rate && rate.baseline < MIN_BASELINE
          ? 'Too few visits to judge'
          : verdictLabel(verdict.flag)}
      </span>
      <span class="font-medium tabular-nums">
        {rate
          ? formatRate(rate.rate)
          : `${formatCount(count?.value ?? 0)} visits`}
      </span>
    </p>
    {#if rate}
      <p class="text-fg-tertiary mt-1 flex justify-between gap-4">
        <span>95% interval</span>
        <span class="tabular-nums">{formatInterval(rate.interval)}</span>
      </p>
    {/if}
    <p class="text-fg-tertiary mt-1 flex justify-between gap-4">
      <span>Typical{by}</span>
      <span class="tabular-nums">
        {rate ? formatRate(rate.typical) : whole(verdict.typical)}
      </span>
    </p>
    {#if band}
      <p class="text-fg-tertiary mt-1 flex justify-between gap-4">
        <span>Normal range</span>
        <span class="tabular-nums">
          {Math.ceil(band[0])}-{Math.floor(band[1])}
        </span>
      </p>
    {/if}
    <p class="text-fg-muted mt-2 text-xs leading-5 whitespace-normal">
      {#if rate}
        {formatCount(rate.hits)} of {formatCount(rate.total)} visits {reached}.
        A rate reads above or below usual only when the typical rate falls
        outside its interval.
      {:else}
        Typical is the median of the last 4 {weekdays}. A count reads above or
        below usual only outside typical ± 2√typical.
      {/if}
    </p>
  </div>
{/snippet}
