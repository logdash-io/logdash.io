<script lang="ts">
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import type { WebAnalyticsRange } from '../../domain/web-analytics';
  import DetailsDialog from '../breakdown/DetailsDialog.svelte';
  import { fitRows, type RowFit } from '../breakdown/fit-rows';
  import MoreRow from '../breakdown/MoreRow.svelte';
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
  let fit = $state<RowFit>({ shown: 0, hidden: 0, more: false });
  let detailsOpen = $state(false);

  function onTab(value: Tab): void {
    tab = value;
  }

  function onFit(next: RowFit): void {
    fit = next;
  }

  function onDetails(): void {
    detailsOpen = true;
  }

  function onDetailsClose(): void {
    detailsOpen = false;
  }
</script>

<section
  class="bg-surface-25-bg flex h-full min-w-0 flex-col gap-2 rounded-2xl p-2"
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

  <div
    class="@container relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden"
    {@attach fitRows(onFit)}
  >
    {@render view()}
    {#if fit.more}
      <MoreRow
        shown={fit.shown}
        total={fit.shown + fit.hidden}
        label={tab === 'journeys' ? 'paths' : 'cohorts'}
        onopen={onDetails}
      />
    {/if}
  </div>
</section>

<DetailsDialog
  isOpen={detailsOpen}
  title={tab === 'journeys' ? 'Journeys' : 'Retention'}
  class="max-w-3xl"
  onclose={onDetailsClose}
>
  <div
    class="@container flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-3 pb-4"
  >
    {@render view()}
  </div>
</DetailsDialog>

{#snippet view()}
  {#if tab === 'journeys'}
    <JourneysView {clusterId} {range} />
  {:else}
    <RetentionView {clusterId} {range} />
  {/if}
{/snippet}
