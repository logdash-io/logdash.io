<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import ProjectView from '$lib/domains/app/projects/ui/ProjectView/ProjectView.svelte';
  import { Feature, UserTier } from '$lib/domains/shared/types.js';
  import { onMount, untrack } from 'svelte';
  import DemoDashboardHeader from './DemoDashboardHeader.svelte';
  import FinalCta from '$lib/landing/FinalCta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';

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
        name: 'Logdash (demo)',
        creatorId: 'demo',
        features: [Feature.LOGGING, Feature.METRICS, Feature.MONITORING],
        members: [],
        tier: UserTier.FREE,
      },
    ]);
  });

  $effect(() => {
    untrack(() => monitoringState.sync(data.clusterId));

    return () => {
      monitoringState.unsync();
    };
  });
</script>

<svelte:head>
  <title>Demo Dashboard | logdash</title>
</svelte:head>

<div class="flex w-full flex-col">
  <DemoDashboardHeader />

  <LandingSection>
    <div class="px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
      <div
        class="ring-hairline bg-base-200 rounded-xl p-2 ring-1 sm:p-4 lg:-mx-4"
      >
        <ProjectView
          priorityProjectId={data.projectId}
          priorityClusterId={data.clusterId}
        />
      </div>
    </div>
  </LandingSection>

  <FinalCta showDemoLink={false} />

  <LandingSection divider={false} rails={false}>
    <Footer />
  </LandingSection>
</div>
