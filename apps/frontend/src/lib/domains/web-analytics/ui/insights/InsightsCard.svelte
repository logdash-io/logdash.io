<script lang="ts">
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import type { WebAnalyticsRange } from '../../domain/web-analytics';
  import JourneysView from './JourneysView.svelte';
  import RetentionView from './RetentionView.svelte';

  type Tab = 'journeys' | 'retention';

  type Props = {
    clusterId: string;
    range: WebAnalyticsRange;
  };

  const { clusterId, range }: Props = $props();

  const TABS: { value: Tab; label: string }[] = [
    { value: 'journeys', label: 'Journey' },
    { value: 'retention', label: 'Retention' },
  ];

  let tab = $state<Tab>('journeys');

  function onTab(value: Tab): void {
    tab = value;
  }
</script>

<section
  class="bg-surface-25-bg flex min-h-[28rem] min-w-0 flex-col gap-2 rounded-2xl p-2"
  aria-label="Journeys and retention"
>
  <header class="flex h-7 shrink-0 items-center justify-between gap-3">
    <div class="min-w-0 overflow-x-auto [scrollbar-width:none]">
      <SegmentedControl
        size="xs"
        label="Insight"
        options={TABS}
        value={tab}
        onChange={onTab}
      />
    </div>
  </header>

  <div class="flex min-h-0 flex-1 flex-col">
    {#if tab === 'journeys'}
      <JourneysView {clusterId} {range} />
    {:else}
      <RetentionView {clusterId} {range} />
    {/if}
  </div>
</section>
