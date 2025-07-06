<script lang="ts">
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import { ChevronDownIcon, Settings2Icon } from 'lucide-svelte';
  import SveltyPicker from 'svelty-picker';

  type Props = {
    selectedLevel: string | null;
    selectedStartDate: string | null;
    selectedEndDate: string | null;
    searchString: string;
    maxDateRangeHours: number;
    onClearAllClicked?: () => void;
  };

  let {
    selectedLevel = $bindable(),
    selectedStartDate = $bindable(),
    selectedEndDate = $bindable(),
    searchString,
    maxDateRangeHours,
    onClearAllClicked,
  }: Props = $props();

  const LOG_LEVELS = [
    { value: 'error', label: 'Error', color: 'bg-[#e7000b]' },
    { value: 'warning', label: 'Warning', color: 'bg-[#fe9a00]' },
    { value: 'info', label: 'Info', color: 'bg-[#155dfc]' },
    { value: 'http', label: 'HTTP', color: 'bg-[#00a6a6]' },
    { value: 'verbose', label: 'Verbose', color: 'bg-[#00a600]' },
    { value: 'debug', label: 'Debug', color: 'bg-[#00a600]' },
    { value: 'silly', label: 'Silly', color: 'bg-[#505050]' },
  ];

  const TIME_RANGES = [
    { value: 'last-15m', label: 'Last 15 minutes', hours: 0.25 },
    { value: 'last-1h', label: 'Last hour', hours: 1 },
    { value: 'last-4h', label: 'Last 4 hours', hours: 4 },
    { value: 'last-24h', label: 'Last 24 hours', hours: 24 },
    { value: 'last-7d', label: 'Last 7 days', hours: 168 },
    { value: 'last-30d', label: 'Last 30 days', hours: 720 },
    { value: 'custom', label: 'Custom', hours: 0 },
  ];

  let startDateInput = $state<string>('');
  let endDateInput = $state<string>('');
  let selectedLevelLocal = $state<string | null>(null);
  let selectedTimeRange = $state<string>('last-24h');

  function formatDateForInput(dateString: string | null): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  }

  function getTimeRangeFromDates(
    startDate: string | null,
    endDate: string | null,
  ): string {
    if (!startDate || !endDate) return 'custom';

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes === 15) return 'last-15m';
    if (diffMinutes === 60) return 'last-1h';
    if (diffMinutes === 240) return 'last-4h';
    if (diffMinutes === 1440) return 'last-24h';
    if (diffMinutes === 10080) return 'last-7d';
    if (diffMinutes === 43200) return 'last-30d';

    return 'custom';
  }

  function getDatesForTimeRange(range: string): {
    startDate: string;
    endDate: string;
  } {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: string;

    switch (range) {
      case 'last-15m':
        startDate = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
        break;
      case 'last-1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case 'last-4h':
        startDate = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
        break;
      case 'last-24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'last-7d':
        startDate = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        break;
      case 'last-30d':
        startDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
        break;
      default:
        startDate = startDateInput
          ? new Date(startDateInput).toISOString()
          : '';
    }

    return { startDate, endDate };
  }

  function handleStartDateChange(value: string): void {
    startDateInput = value;
  }

  function handleEndDateChange(value: string): void {
    endDateInput = value;
  }

  function handleLevelChange(level: string | null): void {
    selectedLevelLocal = level;
  }

  function isTimeRangeUpgradeRequired(timeRange: { hours: number }): boolean {
    return timeRange.hours > maxDateRangeHours;
  }

  const isCustomRangeUpgradeRequired = $derived.by(() => {
    if (selectedTimeRange !== 'custom' || !startDateInput || !endDateInput) {
      return false;
    }

    const start = new Date(startDateInput);
    const end = new Date(endDateInput);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return diffHours > maxDateRangeHours;
  });

  function handleTimeRangeChange(range: string): void {
    const timeRange = TIME_RANGES.find((tr) => tr.value === range);
    if (timeRange && isTimeRangeUpgradeRequired(timeRange)) {
      return;
    }

    selectedTimeRange = range;
    if (range !== 'custom') {
      const { startDate, endDate } = getDatesForTimeRange(range);
      startDateInput = formatDateForInput(startDate);
      endDateInput = formatDateForInput(endDate);
    }
  }

  function applyFilters(): void {
    if (selectedTimeRange === 'custom' && isCustomRangeUpgradeRequired) {
      return;
    }

    const dates =
      selectedTimeRange === 'custom'
        ? {
            startDate: startDateInput
              ? new Date(startDateInput).toISOString()
              : null,
            endDate: endDateInput ? new Date(endDateInput).toISOString() : null,
          }
        : getDatesForTimeRange(selectedTimeRange);

    selectedStartDate = dates.startDate;
    selectedEndDate = dates.endDate;
    selectedLevel = selectedLevelLocal as any;
  }

  function clearAllFilters(): void {
    startDateInput = '';
    endDateInput = '';
    selectedLevelLocal = null;
    selectedTimeRange = 'last-24h';
    onClearAllClicked?.();
  }

  function hasActiveFilters(): boolean {
    return Boolean(
      selectedLevel ||
        selectedStartDate ||
        selectedEndDate ||
        searchString?.trim(),
    );
  }

  function hasPendingChanges(): boolean {
    const currentTimeRange = getTimeRangeFromDates(
      selectedStartDate,
      selectedEndDate,
    );

    const timeRangeChanged = selectedTimeRange !== currentTimeRange;

    const customRangeChanged =
      selectedTimeRange === 'custom' &&
      (startDateInput !== formatDateForInput(selectedStartDate) ||
        endDateInput !== formatDateForInput(selectedEndDate));

    const levelChanged = selectedLevelLocal !== selectedLevel;

    return timeRangeChanged || customRangeChanged || levelChanged;
  }

  $effect(() => {
    if (selectedStartDate) {
      startDateInput = formatDateForInput(selectedStartDate);
    } else {
      startDateInput = '';
    }
    if (selectedEndDate) {
      endDateInput = formatDateForInput(selectedEndDate);
    } else {
      endDateInput = '';
    }
    selectedLevelLocal = selectedLevel;
    selectedTimeRange = getTimeRangeFromDates(
      selectedStartDate,
      selectedEndDate,
    );
  });
</script>

{#snippet menu(close: () => void)}
  <div
    class="dropdown-content text-secondary ld-card-base rounded-box z-1 w-80 p-4 shadow"
  >
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium">Time Range</label>
        <div class="grid grid-cols-1 gap-2">
          {#each TIME_RANGES as range}
            {@const requiresUpgrade = isTimeRangeUpgradeRequired(range)}
            <UpgradeElement
              class={[
                'btn btn-sm',
                {
                  'btn-subtle': selectedTimeRange !== range.value,
                  'border-primary': selectedTimeRange === range.value,
                  'justify-between': requiresUpgrade,
                  'justify-center': !requiresUpgrade,
                },
              ]}
              onclick={() => handleTimeRangeChange(range.value)}
              enabled={requiresUpgrade}
              source="logs-date-range"
            >
              <span>{range.label}</span>
              {#if requiresUpgrade}
                <span class="badge badge-xs badge-primary badge-soft">
                  Upgrade
                </span>
              {/if}
            </UpgradeElement>
          {/each}
        </div>

        {#if selectedTimeRange === 'custom'}
          <div class="mt-3 gap-2">
            <div class="space-y-1">
              <label class="text-base-content/70 block text-xs font-medium">
                From
              </label>
              <SveltyPicker
                bind:value={startDateInput}
                mode="datetime"
                placeholder="Select start date"
                inputClasses="ld-input ld-input-padding w-full text-xs"
                displayFormat={'yyyy M dd, hh:ii'}
              />
            </div>
            <div class="space-y-1">
              <label class="text-base-content/70 block text-xs font-medium">
                To
              </label>
              <SveltyPicker
                bind:value={endDateInput}
                mode="datetime"
                placeholder="Select end date"
                inputClasses="ld-input ld-input-padding w-full text-xs"
                displayFormat={'yyyy M dd, hh:ii'}
              />
            </div>
          </div>
        {/if}
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium">Log Level</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            class={[
              'btn btn-sm justify-start gap-2',
              {
                'btn-subtle': selectedLevelLocal !== null,
                'border-primary': selectedLevelLocal === null,
              },
            ]}
            onclick={() => handleLevelChange(null)}
          >
            All Levels
          </button>
          {#each LOG_LEVELS as level}
            <button
              class={[
                'btn btn-sm justify-start gap-2',
                {
                  'btn-subtle': selectedLevelLocal !== level.value,
                  'border-primary': selectedLevelLocal === level.value,
                },
              ]}
              onclick={() => handleLevelChange(level.value)}
            >
              <div class={['h-2 w-2 rounded-full', level.color]}></div>
              {level.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <button
          class="btn btn-secondary btn-sm flex-1"
          onclick={() => {
            clearAllFilters();
            close();
          }}
          disabled={!hasActiveFilters()}
        >
          Clear All
        </button>

        {#if hasPendingChanges()}
          <button
            class="btn btn-subtle btn-sm flex-1"
            onclick={() => {
              if (selectedStartDate) {
                startDateInput = formatDateForInput(selectedStartDate);
              } else {
                startDateInput = '';
              }
              if (selectedEndDate) {
                endDateInput = formatDateForInput(selectedEndDate);
              } else {
                endDateInput = '';
              }
              selectedLevelLocal = selectedLevel;
              selectedTimeRange = getTimeRangeFromDates(
                selectedStartDate,
                selectedEndDate,
              );
            }}
          >
            Reset
          </button>
        {/if}

        <UpgradeElement
          enabled={isCustomRangeUpgradeRequired}
          source="logs-filter-dropdown"
          class={[
            'btn btn-sm btn-primary flex-1',
            {
              'justify-between': isCustomRangeUpgradeRequired,
              'justify-center': !isCustomRangeUpgradeRequired,
              'btn-disabled': !hasPendingChanges(),
            },
          ]}
          interactive={hasPendingChanges()}
          onclick={() => {
            applyFilters();
            close();
          }}
        >
          <span>Apply</span>
          {#if isCustomRangeUpgradeRequired}
            <span class="badge badge-xs badge-secondary">Upgrade</span>
          {/if}
        </UpgradeElement>
      </div>
    </div>
  </div>
{/snippet}

<Tooltip content={menu} interactive={true} placement="bottom" trigger="click">
  <button
    class={[
      'btn btn-sm btn-subtle gap-1.5',
      {
        'btn-outline': !hasActiveFilters(),
        'btn-secondary': hasActiveFilters(),
      },
    ]}
    data-posthog-id="logs-filter-dropdown"
  >
    <Settings2Icon class="h-4 w-4" />
    <span>Filters</span>
    {#if hasActiveFilters()}
      <span class="badge badge-xs">
        {[
          selectedLevel,
          selectedStartDate || selectedEndDate,
          searchString?.trim(),
        ].filter(Boolean).length}
      </span>
    {/if}
    <ChevronDownIcon class="h-4 w-4" />
  </button>
</Tooltip>
