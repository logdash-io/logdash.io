<script lang="ts">
  import { publicDashboardManagerState } from '$lib/domains/app/projects/application/public-dashboards/public-dashboard-configurator.state.svelte.js';
  import type { PublicDashboard } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard.js';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';
  import StatusPageDemo from './StatusPageDemo.svelte';

  type Props = {
    clusterId: string;
    onDashboardCreated: (dashboard: PublicDashboard) => void;
  };
  const { clusterId, onDashboardCreated }: Props = $props();

  let isCreating = $state(false);

  const totalPublishedCount = $derived(clustersState.publishedDashboardsCount);
  const maxAllowed = $derived(
    exposedConfigState.maxNumberOfPublicDashboards(userState.tier),
  );
  const canCreate = $derived(totalPublishedCount < maxAllowed);

  async function onCreate(): Promise<void> {
    if (isCreating) return;
    isCreating = true;

    try {
      const dashboard = await publicDashboardManagerState.create(
        clusterId,
        'Status Page',
      );
      onDashboardCreated(dashboard);
      toast.success('Status page created successfully');
    } catch {
      toast.error('Failed to create status page');
    } finally {
      isCreating = false;
    }
  }
</script>

<div
  class="relative flex flex-col min-h-[55vh] w-full items-center justify-center"
>
  <div
    class="relative flex items-center justify-center overflow-hidden w-full max-w-md -mb-20"
    aria-hidden="true"
  >
    <StatusPageDemo />

    <div
      class="absolute h-4/5 bottom-11 w-full bg-gradient-to-b from-transparent via-base-300/70 to-base-300"
    ></div>
  </div>

  <div
    class="relative z-10 flex max-w-md flex-col items-center text-center px-4"
  >
    <h1 class="mb-2 text-3xl font-bold">Keep your users in the loop</h1>

    <p class="text-base-content/70 mb-6 text-base leading-relaxed">
      Share your project status with everyone so they know what's going on.
    </p>

    <div class="flex flex-col gap-3">
      {#if canCreate}
        <button
          onclick={onCreate}
          disabled={isCreating}
          class="btn btn-primary gap-2"
          data-posthog-id="create-status-page-button"
        >
          {#if isCreating}
            <span class="loading loading-spinner loading-xs"></span>
          {/if}
          Create your status page
          <ArrowRightIcon class="size-4" />
        </button>
      {:else}
        <UpgradeButton source="status-page-limit">
          Upgrade to create more status pages
        </UpgradeButton>
      {/if}
    </div>
  </div>
</div>
