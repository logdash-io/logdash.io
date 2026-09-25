<script lang="ts">
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { Badge, Tab, Tabs } from '@logdash/hyper-ui/presentational';

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

  function onTabsClickCapture(event: MouseEvent): void {
    if (canSwitchTabs) return;
    event.preventDefault();
    event.stopPropagation();
    upgradeState.openModal();
  }
</script>

<div class="mb-4 flex items-center justify-between">
  <h2 class="text-xl font-medium">{title}</h2>

  <div class="relative inline-flex w-max">
    {#if !canSwitchTabs}
      <Badge
        size="xs"
        class="absolute top-0 right-0 z-1 translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
      >
        PRO
      </Badge>
    {/if}

    <Tabs size="xs" boxed onclickcapture={onTabsClickCapture}>
      <Tab
        class="w-20"
        active={currentRange === smallOption}
        onclick={() => onRangeChange(smallOption)}
      >
        {smallOption}
      </Tab>

      <Tab
        class="w-20"
        active={currentRange === largeOption}
        onclick={() => onRangeChange(largeOption)}
      >
        {largeOption}
      </Tab>
    </Tabs>
  </div>
</div>
