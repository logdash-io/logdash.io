<script lang="ts">
  import { page } from '$app/state';
  import { upgradeState } from '$lib/shared/upgrade/upgrade.state.svelte.js';

  interface Props {
    title: string;
    currentRange: string;
    smallOption: string;
    largeOption: string;
    canSwitchTabs: boolean;
    onRangeChange: (range: string) => void;
  }

  let {
    title,
    currentRange,
    smallOption,
    largeOption,
    canSwitchTabs,
    onRangeChange,
  }: Props = $props();

  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );
</script>

<div class="mb-4 flex items-center justify-between">
  <h2 class="text-xl font-semibold">{title}</h2>

  {#if !isOnDemoDashboard}
    <div class="indicator">
      {#if !canSwitchTabs}
        <span class="indicator-item badge badge-soft badge-primary badge-xs">
          PRO
        </span>
      {/if}

      <div
        role="tablist"
        class={['tabs tabs-box tabs-xs bg-base-100/70 rounded-lg shadow-none']}
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
            'tab w-20 rounded-lg',
            {
              'tab-active btn-secondary': currentRange === smallOption,
            },
          ]}
          onclick={() => onRangeChange(smallOption)}
        >
          {smallOption}
        </button>

        <button
          role="tab"
          class={[
            'tab w-20 rounded-lg',
            {
              'tab-active btn-secondary': currentRange === largeOption,
            },
          ]}
          onclick={() => onRangeChange(largeOption)}
        >
          {largeOption}
        </button>
      </div>
    </div>
  {/if}
</div>
