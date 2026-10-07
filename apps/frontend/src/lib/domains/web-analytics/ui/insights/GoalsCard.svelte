<script lang="ts">
  import type {
    WebAnalyticsFilter,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import DashboardCard from '../breakdown/DashboardCard.svelte';
  import { CARD_ROWS } from '../breakdown/dashboard-card';
  import DetailsDialog from '../breakdown/DetailsDialog.svelte';
  import GoalsView from './GoalsView.svelte';

  type Props = {
    report: WebAnalyticsReport | null;
    eventPath: (name: string) => `/app/domains/${string}`;
    onfilter: (filter: WebAnalyticsFilter) => void;
  };

  const { report, eventPath, onfilter }: Props = $props();

  let detailsOpen = $state(false);

  function onDetails(): void {
    detailsOpen = true;
  }

  function onDetailsClose(): void {
    detailsOpen = false;
  }

  function onDetailsFilter(filter: WebAnalyticsFilter): void {
    detailsOpen = false;
    onfilter(filter);
  }
</script>

<DashboardCard
  label="Goals"
  expandLabel="Show all goals"
  onexpand={report?.breakdowns.goals.length ? onDetails : undefined}
>
  <GoalsView {report} limit={CARD_ROWS} {eventPath} {onfilter} />
</DashboardCard>

<DetailsDialog
  isOpen={detailsOpen}
  title="Goals"
  class="max-w-xl"
  onclose={onDetailsClose}
>
  <div class="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5">
    <GoalsView {report} {eventPath} onfilter={onDetailsFilter} />
  </div>
</DetailsDialog>
