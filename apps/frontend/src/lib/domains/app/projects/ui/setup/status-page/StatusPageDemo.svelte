<script lang="ts">
  import { generateDemoStatusPage } from '$lib/domains/app/projects/domain/status-page-demo-data';
  import { PublicDashboard } from '@logdash/hyper-ui/features';

  const page = generateDemoStatusPage();
</script>

<div
  class="h-104 w-full overflow-hidden mask-b-from-[19.5rem] mask-b-to-[23.5rem]"
  inert
>
  <PublicDashboard class="-mt-10" {page} withBranding={false} />
</div>
