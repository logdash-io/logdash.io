<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import {
    TIME_RANGE_PRESETS,
    isTimeRangeExceedingLimit,
  } from '$lib/domains/logs/domain/time-range';

  type Props = {
    selectedTimeRange: string;
    maxDateRangeHours: number;
    onTimeRangeChange: (range: string) => void;
  };

  const { selectedTimeRange, maxDateRangeHours, onTimeRangeChange }: Props =
    $props();

  function getSelectedLabel(): string {
    const range = TIME_RANGE_PRESETS.find((r) => r.value === selectedTimeRange);
    return range?.label || 'Last 24 hours';
  }
</script>

{#snippet menu(close: () => void)}
  <div
    class="dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    <ul class="">
      {#each TIME_RANGE_PRESETS as range}
        {@const requiresUpgrade = isTimeRangeExceedingLimit(
          range.hours,
          maxDateRangeHours,
        )}
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
