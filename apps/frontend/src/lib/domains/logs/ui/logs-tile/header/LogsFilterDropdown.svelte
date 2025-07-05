<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import { ChevronDownIcon, Settings2Icon } from 'lucide-svelte';

  type Props = {
    selectedLevel: string | null;
    selectedStartDate: string | null;
    selectedEndDate: string | null;
  };

  const { selectedLevel, selectedStartDate, selectedEndDate }: Props = $props();

  const LOG_LEVELS = [
    { value: 'error', label: 'Error', color: 'bg-[#e7000b]' },
    { value: 'warning', label: 'Warning', color: 'bg-[#fe9a00]' },
    { value: 'info', label: 'Info', color: 'bg-[#155dfc]' },
    { value: 'http', label: 'HTTP', color: 'bg-[#00a6a6]' },
    { value: 'verbose', label: 'Verbose', color: 'bg-[#00a600]' },
    { value: 'debug', label: 'Debug', color: 'bg-[#00a600]' },
    { value: 'silly', label: 'Silly', color: 'bg-[#505050]' },
  ];

  let startDateInput = $state('');
  let endDateInput = $state('');
  let selectedLevelLocal = $state<string | null>(null);

  function formatDateForInput(dateString: string | null): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
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

  function applyFilters(): void {
    logsState.setFilters({
      startDate: startDateInput ? new Date(startDateInput).toISOString() : null,
      endDate: endDateInput ? new Date(endDateInput).toISOString() : null,
      level: selectedLevelLocal as any,
    });
  }

  function clearAllFilters(): void {
    startDateInput = '';
    endDateInput = '';
    selectedLevelLocal = null;
    logsState.setFilters({
      startDate: null,
      endDate: null,
      level: null,
      searchString: '',
    });
  }

  function hasActiveFilters(): boolean {
    return Boolean(
      selectedLevel ||
        selectedStartDate ||
        selectedEndDate ||
        logsState.filters.searchString?.trim(),
    );
  }

  function hasPendingChanges(): boolean {
    return (
      startDateInput !== formatDateForInput(selectedStartDate) ||
      endDateInput !== formatDateForInput(selectedEndDate) ||
      selectedLevelLocal !== selectedLevel
    );
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
  });
</script>

{#snippet menu(close: () => void)}
  <div
    class="dropdown-content text-secondary ld-card-base rounded-box z-1 w-80 p-4 shadow"
  >
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium">Start Date & Time</label>
        <input
          type="datetime-local"
          class="ld-input ld-input-padding w-full"
          bind:value={startDateInput}
          onchange={(e) =>
            handleStartDateChange((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium">End Date & Time</label>
        <input
          type="datetime-local"
          class="ld-input ld-input-padding w-full"
          bind:value={endDateInput}
          onchange={(e) =>
            handleEndDateChange((e.target as HTMLInputElement).value)}
        />
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
            }}
          >
            Reset
          </button>
        {/if}

        <button
          class={['btn btn-sm btn-primary flex-1']}
          disabled={!hasPendingChanges()}
          onclick={() => {
            applyFilters();
            close();
          }}
        >
          Apply
        </button>
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
          selectedStartDate,
          selectedEndDate,
          logsState.filters.searchString?.trim(),
        ].filter(Boolean).length}
      </span>
    {/if}
    <ChevronDownIcon class="h-4 w-4" />
  </button>
</Tooltip>
