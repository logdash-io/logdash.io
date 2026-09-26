<script lang="ts">
  import { generateDemoData } from '$lib/domains/app/projects/domain/status-page-demo-data';
  import {
    PublicDashboard as PublicDashboardComponent,
    PublicDashboardState,
  } from '@logdash/hyper-ui/features';

  class DemoStatusPageState extends PublicDashboardState {
    constructor() {
      super();
      this.setDashboardData(generateDemoData());
    }

    public async loadDashboard(): Promise<void> {}
  }

  const demoState = new DemoStatusPageState();
</script>

<div class="w-full">
  <PublicDashboardComponent
    state={demoState}
    enablePolling={false}
    maxBucketsToShow={90}
    maxPingsToShow={60}
    withBranding={false}
    withHeader={true}
    expanded={false}
  />
</div>
