<script lang="ts">
  import { downtimeMs, formatDuration, PERIODS } from './uptime';

  type Props = {
    percent: number;
  };

  const { percent }: Props = $props();
</script>

<table class="w-full text-sm">
  <thead>
    <tr class="border-surface-root-border border-b">
      <th class="text-fg-muted pb-2.5 text-left font-medium">Period</th>
      <th class="text-fg-muted pb-2.5 text-right font-medium">
        Downtime allowed
      </th>
    </tr>
  </thead>
  <tbody class="divide-surface-root-border divide-y">
    {#each PERIODS as period (period.noun)}
      <tr>
        <td class="text-fg-tertiary py-2.5">{period.label}</td>
        <td class="text-fg-default py-2.5 text-right tabular-nums">
          {formatDuration(downtimeMs(percent, period.ms))}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
