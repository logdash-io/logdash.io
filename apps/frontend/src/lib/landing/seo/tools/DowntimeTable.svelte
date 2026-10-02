<script lang="ts">
  import { downtimeMs, formatDuration, PERIODS } from './uptime';

  type Props = {
    percent: number;
  };

  const { percent }: Props = $props();
</script>

<table class="w-full text-sm">
  <thead>
    <tr class="border-hairline border-b">
      <th class="text-neutral-500 pb-2.5 text-left font-medium">Period</th>
      <th class="text-neutral-500 pb-2.5 text-right font-medium">
        Downtime allowed
      </th>
    </tr>
  </thead>
  <tbody class="divide-hairline divide-y">
    {#each PERIODS as period (period.noun)}
      <tr>
        <td class="text-neutral-400 py-2.5">{period.label}</td>
        <td class="text-fg-default py-2.5 text-right tabular-nums">
          {formatDuration(downtimeMs(percent, period.ms))}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
