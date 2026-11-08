<script lang="ts">
  import { formatPercent } from '../../domain/analytics-format';

  type Props = {
    rate: number | null;
    title?: string;
  };

  const { rate, title }: Props = $props();

  const share = $derived(Math.min(100, Math.max(0, rate ?? 0)));
</script>

<td
  class={[
    'rounded-md py-1.5 text-center text-xs tabular-nums',
    rate === null
      ? 'text-fg-faint'
      : share >= 62
        ? 'text-fg-inverse'
        : share >= 5
          ? 'text-fg-default'
          : 'text-fg-tertiary',
  ]}
  style:background-color={rate === null
    ? undefined
    : `color-mix(in oklch, var(--heat-100) ${share}%, var(--heat-0))`}
  {title}
>
  {rate === null ? '–' : formatPercent(rate)}
</td>
