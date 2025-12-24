<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';

  type Props = {
    selectedTimeRange: string;
    maxDateRangeHours: number;
    onTimeRangeChange: (range: string) => void;
  };

  const { selectedTimeRange, maxDateRangeHours, onTimeRangeChange }: Props =
    $props();

  const TIME_RANGES = [
    { value: 'last-15m', label: 'Last 15 minutes', hours: 0.25 },
    { value: 'last-1h', label: 'Last hour', hours: 1 },
    { value: 'last-4h', label: 'Last 4 hours', hours: 4 },
    { value: 'last-24h', label: 'Last 24 hours', hours: 24 },
    { value: 'last-7d', label: 'Last 7 days', hours: 168 },
    { value: 'last-30d', label: 'Last 30 days', hours: 720 },
    { value: 'custom', label: 'Custom', hours: 0 },
  ];

  function getSelectedLabel(): string {
    const range = TIME_RANGES.find((r) => r.value === selectedTimeRange);
    return range?.label || 'Last 24 hours';
  }

  function isTimeRangeUpgradeRequired(timeRange: { hours: number }): boolean {
    return timeRange.hours > maxDateRangeHours;
  }
</script>

{#snippet menu(close: () => void)}
  <div
    class="dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    <ul class="">
      {#each TIME_RANGES as range}
        {@const requiresUpgrade = isTimeRangeUpgradeRequired(range)}
        <li
          class="hover:bg-base-100 flex items-center justify-start rounded-lg px-3"
        >
          <UpgradeElement
            class="flex w-full cursor-pointer items-center justify-between gap-3 py-1.5"
            onclick={() => {
              onTimeRangeChange(range.value);
              close();
            }}
            enabled={requiresUpgrade}
            source="logs-date-range"
            interactive={true}
          >
            <span>{range.label}</span>
            {#if requiresUpgrade}
              <span class="badge badge-xs badge-primary badge-soft">
                Upgrade
              </span>
            {/if}
          </UpgradeElement>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

<Tooltip
  class="w-full"
  content={menu}
  interactive={true}
  placement="bottom"
  trigger="click"
  closeOnOutsideTooltipClick={true}
>
  <button
    class="btn btn-sm btn-subtle w-full justify-between gap-1.5"
    data-posthog-id="logs-time-range-select"
  >
    <span>{getSelectedLabel()}</span>
    <ChevronDownIcon class="h-4 w-4 shrink-0" />
  </button>
</Tooltip>
