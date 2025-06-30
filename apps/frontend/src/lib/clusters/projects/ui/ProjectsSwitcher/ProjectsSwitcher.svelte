<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
  import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
  import { userState } from '$lib/shared/user/application/user.state.svelte.js';
  import { projectsState } from '../../application/projects.state.svelte.js';
  import ProjectContextMenu from './ProjectContextMenu.svelte';
  import ProjectCreator from './ProjectCreator.svelte';
  import ProjectHealthStatus from '../monitor-status/MonitorStatusBadge.svelte';
  import { exposedConfigState } from '$lib/shared/exposed-config/application/exposed-config.state.svelte';

  type Props = {
    withDefaultRedirect: boolean;
    creationDisabled?: boolean;
  };
  const { withDefaultRedirect, creationDisabled }: Props = $props();
  const project_badge_class =
    'ld-card-base rounded-full py-2 px-2.5 flex cursor-pointer items-center';

  const isOnDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );

  $effect(() => {
    const project_id = page.url.searchParams.get('project_id');

    if (!project_id && projectsState.projects.length && withDefaultRedirect) {
      const defaultProject = projectsState.projects[0];
      if (defaultProject) {
        goto(`?project_id=${defaultProject.id}`, {
          replaceState: true,
        });
      }
    }
  });

  const totalProjectsCount = $derived(clustersState.allClustersProjectsCount);
  const tierMaxProjects = $derived(
    exposedConfigState.maxNumberOfProjects(userState.tier),
  );
</script>

<div class="tabs z-30 gap-1.5 sm:gap-3" role="tablist">
  {#each projectsState.projects as project}
    {@const activeProject =
      project.id === page.url.searchParams.get('project_id')}

    <div
      onclick={() => {
        if (activeProject || isOnDemoDashboard) {
          return;
        }
        goto(`?project_id=${project.id}`);
      }}
      class={[
        project_badge_class,
        {
          'ring-primary/30 ring': activeProject,
          'pr-2': activeProject && !isOnDemoDashboard,
          // 'px-4': !activeProject,
        },
      ]}
      role="tab"
    >
      <ProjectHealthStatus projectId={project.id} />

      <span class="mx-2 select-none">
        {project.name}
      </span>

      {#if activeProject && !isOnDemoDashboard}
        <ProjectContextMenu {project} />
      {/if}
    </div>
  {/each}

  {#if !creationDisabled}
    <ProjectCreator
      canAddMore={totalProjectsCount < tierMaxProjects}
      onSubmit={(name) => {
        projectsState
          .createProject(page.params.cluster_id, name)
          .then((projectId) => {
            goto(
              `/app/clusters/${page.params.cluster_id}/?project_id=${projectId}`,
              { replaceState: true },
            );
            toast.success(
              `Service ${name} created successfully, you can now configure it.`,
              5000,
            );
          });
      }}
    />
  {/if}
</div>
