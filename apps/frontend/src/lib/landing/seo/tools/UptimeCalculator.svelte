<script lang="ts">
  import { untrack } from 'svelte';
  import DowntimeTable from './DowntimeTable.svelte';
  import ToolField from './ToolField.svelte';
  import ToolPanel from './ToolPanel.svelte';
  import {
    downtimeMs,
    formatDuration,
    formatPercent,
    parsePercent,
    PERIODS,
  } from './uptime';

  type Props = {
    percent?: number;
  };

  const { percent: initialPercent = 99.9 }: Props = $props();

  const errorId = $props.id();
  const year = PERIODS[PERIODS.length - 1];

  let input = $state(untrack(() => String(initialPercent)));

  const percent = $derived(parsePercent(input));
</script>

<ToolPanel label="Uptime calculator">
  {#snippet controls()}
    <ToolField
      label="Uptime"
      bind:value={input}
      suffix="%"
      inputmode="decimal"
      invalid={percent === null}
      describedby={percent === null ? errorId : undefined}
      class="max-w-48"
    />
  {/snippet}

  {#if percent === null}
    <p id={errorId} role="status" class="text-error text-sm">
      Enter a percentage from 0 to 100, like 99.9.
    </p>
  {:else}
    <p role="status" class="text-fg-tertiary text-[15px] leading-7">
      <strong class="text-fg-default font-medium">
        {formatPercent(percent)}
      </strong>
      uptime allows
      <strong class="text-fg-default font-medium">
        {formatDuration(downtimeMs(percent, year.ms))}
      </strong>
      of downtime a year.
    </p>
    <DowntimeTable {percent} />
  {/if}
</ToolPanel>
