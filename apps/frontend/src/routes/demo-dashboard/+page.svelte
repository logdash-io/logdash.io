<script lang="ts">
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
  import ClusterView from '$lib/clusters/clusters/ui/ClusterView/ClusterView.svelte';
  import { projectsState } from '$lib/clusters/projects/application/projects.state.svelte.js';
  import { Feature, UserTier } from '$lib/shared/types.js';
  import { onMount } from 'svelte';
  import DemoDashboardHeader from './DemoDashboardHeader.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import FlamingoIcon from '$lib/shared/icons/FlamingoIcon.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';

  type Props = {
    data: {
      projectId: string;
      clusterId: string;
    };
  };
  const { data }: Props = $props();

  onMount(() => {
    clustersState.set([
      {
        id: data.clusterId,
        name: 'Demo Cluster',
        creatorId: 'demo',
        publicDashboards: [],
        members: [],
        projects: [],
        tier: UserTier.FREE,
      },
    ]);
    projectsState.set([
      {
        id: data.projectId,
        name: 'Logdash (prod)',
        creatorId: 'demo',
        features: [Feature.LOGGING, Feature.METRICS],
        members: [],
        tier: UserTier.FREE,
      },
    ]);
  });
</script>

<svelte:head>
  <title>Demo Dashboard | logdash</title>
</svelte:head>

<div class="w-full max-w-7xl space-y-4 px-4 pb-4 sm:space-y-8 sm:px-0 sm:pb-8">
  <DemoDashboardHeader />

  <div class="ld-card relative mx-auto w-full max-w-7xl p-4">
    <ClusterView priorityClusterId={data.clusterId} />
  </div>

  <div
    class="ld-card text-primary-content mx-2 flex flex-col-reverse items-center justify-between py-24 text-left sm:mx-0 sm:flex-row"
  >
    <div>
      <h2
        class="mb-8 text-center text-3xl font-bold sm:text-left sm:text-4xl"
      >
        Enjoying what you see?
      </h2>

      <FlamingoIcon
        class="text-primary mx-auto mb-6 h-54 w-54 sm:hidden"
      />

      <p class="mb-10 text-lg opacity-90">
        Get started with logdash today and see how easy it is to monitor
        your system in minutes.
      </p>
      <a
        class="btn btn-primary btn-md sm:btn-lg w-full sm:w-fit"
        data-posthog-id="demo-dashboard-cta"
        href="/features"
      >
        Understand your system in minutes
        <ArrowRightIcon class="ml-1 h-5 w-5 sm:ml-2 sm:h-6 sm:w-6" />
      </a>
    </div>

    <FlamingoIcon class="text-primary hidden h-54 w-54 sm:block" />
  </div>

  <Footer />
</div>
