<script lang="ts">
  import { page } from '$app/state';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import type { PingBucketPeriod } from '$lib/domains/app/projects/domain/monitoring/ping-bucket';

  interface Props {
    currentRange: PingBucketPeriod;
    canSwitchTabs: boolean;
    onRangeChange: (range: PingBucketPeriod) => void;
  }

  let { currentRange, canSwitchTabs, onRangeChange }: Props = $props();

  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );

  const hourlyOption: PingBucketPeriod = '90h';
  const dailyOption: PingBucketPeriod = '90d';
</script>

<div class="flex items-center justify-end">
  {#if !isOnDemoDashboard}
    <div
      role="tablist"
      class={['text-secondary/90 rounded-lg font-mono shadow-none']}
      onclickcapture={(e) => {
        if (!canSwitchTabs) {
          e.preventDefault();
          e.stopPropagation();
          upgradeState.openModal();
          return;
        }
      }}
    >
      <button
        role="tab"
        class={[
          'cursor-pointer',
          {
            'underline underline-offset-2': currentRange === hourlyOption,
          },
        ]}
        onclick={() => onRangeChange(hourlyOption)}
      >
        90h
      </button>
      |
      <button
        role="tab"
        class={[
          'cursor-pointer',
          {
            'underline underline-offset-2': currentRange === dailyOption,
          },
        ]}
        onclick={() => onRangeChange(dailyOption)}
      >
        90d
      </button>
    </div>
  {/if}
</div>
