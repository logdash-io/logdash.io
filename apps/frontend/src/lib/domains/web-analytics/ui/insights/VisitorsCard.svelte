<script lang="ts">
  import type { WebAnalyticsRange } from '../../domain/web-analytics';
  import DashboardCard from '../breakdown/DashboardCard.svelte';
  import DetailsDialog from '../breakdown/DetailsDialog.svelte';
  import VisitorsView from './VisitorsView.svelte';

  type Props = {
    clusterId: string;
    range: WebAnalyticsRange;
  };

  const { clusterId, range }: Props = $props();

  const VISITOR_ROWS = 5;

  let detailsOpen = $state(false);

  function onDetails(): void {
    detailsOpen = true;
  }

  function onDetailsClose(): void {
    detailsOpen = false;
  }
</script>

<DashboardCard
  label="Recent visitors"
  expandLabel="Show all visitors"
  onexpand={onDetails}
>
  <VisitorsView {clusterId} {range} limit={VISITOR_ROWS} />
</DashboardCard>

<DetailsDialog
  isOpen={detailsOpen}
  title="Visitors"
  class="sm:max-w-3xl"
  onclose={onDetailsClose}
>
  <div class="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5">
    <VisitorsView {clusterId} {range} />
  </div>
</DetailsDialog>
