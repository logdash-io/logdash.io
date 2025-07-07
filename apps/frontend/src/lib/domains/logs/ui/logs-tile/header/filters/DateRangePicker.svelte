<script lang="ts">
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import SveltyPicker from 'svelty-picker';

  type Props = {
    startDate: string;
    endDate: string;
    maxDateRangeHours: number;
    onDateChange: (startDate: string, endDate: string) => void;
  };

  const { startDate, endDate, maxDateRangeHours, onDateChange }: Props =
    $props();

  let startDateInput = $state(startDate);
  let endDateInput = $state(endDate);

  const isCustomRangeUpgradeRequired = $derived.by(() => {
    if (!startDateInput || !endDateInput) {
      return false;
    }

    const start = new Date(startDateInput);
    const end = new Date(endDateInput);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return diffHours > maxDateRangeHours;
  });

  function applyDateRange(): void {
    if (!isCustomRangeUpgradeRequired) {
      onDateChange(startDateInput, endDateInput);
    }
  }

  $effect(() => {
    startDateInput = startDate;
    endDateInput = endDate;
  });
</script>

<div class="space-y-3">
  <div class="space-y-1">
    <label class="text-base-content/70 block text-xs font-medium">From</label>
    <SveltyPicker
      bind:value={startDateInput}
      mode="datetime"
      placeholder="Select start date"
      inputClasses="ld-input ld-input-padding w-full text-xs"
      displayFormat={'yyyy M dd, hh:ii'}
    />
  </div>

  <div class="space-y-1">
    <label class="text-base-content/70 block text-xs font-medium">To</label>
    <SveltyPicker
      bind:value={endDateInput}
      mode="datetime"
      placeholder="Select end date"
      inputClasses="ld-input ld-input-padding w-full text-xs"
      displayFormat={'yyyy M dd, hh:ii'}
    />
  </div>

  <UpgradeElement
    enabled={isCustomRangeUpgradeRequired}
    source="logs-filter-dropdown"
    class={[
      'btn btn-sm btn-primary w-full',
      {
        'justify-between': isCustomRangeUpgradeRequired,
        'justify-center': !isCustomRangeUpgradeRequired,
      },
    ]}
    interactive={true}
    onclick={() => applyDateRange()}
  >
    <span>Apply Date Range</span>
    {#if isCustomRangeUpgradeRequired}
      <span class="badge badge-xs badge-secondary">Upgrade</span>
    {/if}
  </UpgradeElement>
</div>
