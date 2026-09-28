<script lang="ts">
  import { generateDemoStatusPage } from '$lib/domains/app/projects/domain/status-page-demo-data';
  import { PublicDashboard } from '@logdash/hyper-ui/features';

  const page = generateDemoStatusPage();
</script>

<div class="h-104 w-full overflow-hidden mask-b-from-40% mask-b-to-85%" inert>
  <PublicDashboard {page} withBranding={false} />
</div>
