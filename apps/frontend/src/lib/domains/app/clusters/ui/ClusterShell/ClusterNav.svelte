<script lang="ts">
  import { page } from '$app/state';
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import NavContextMenu from '$lib/domains/app/clusters/ui/ClusterShell/NavContextMenu.svelte';

  type BreadcrumbStep = {
    name: string;
    path: string;
  };

  const breadcrumb: BreadcrumbStep[] = $derived.by(() => {
    const allProjectsStep: BreadcrumbStep = {
      name: 'All Projects',
      path: '/app/clusters',
    };
    if (page.url.pathname.includes('/setup')) {
      return [
        {
          name: 'Setup',
          path: `/app/clusters/new`,
        },
      ];
    }

    if (page.params.cluster_id) {
      return [
        allProjectsStep,
        {
          name: clustersState.clusters.find(
            (p) => p.id === page.params.cluster_id,
          )?.name,
          path: page.params.cluster_id,
        },
      ];
    }

    return [allProjectsStep];
  });
</script>

{#snippet navBreadcrumb()}
  {#each breadcrumb as breadcrumbStep, i}
    <a
      draggable="false"
      data-posthog-id="cluster-nav-breadcrumb"
      href={i === 0
        ? `${breadcrumbStep.path}`
        : `${breadcrumb
            .slice(0, i + 1)
            .map((b) => b.path)
            .join('/')}`}
      class={[
        {
          'font-semibold': i === breadcrumb.length - 1,
        },
        {
          'opacity-60': i !== breadcrumb.length - 1,
        },
      ]}
    >
      /{breadcrumbStep.name}
    </a>
  {/each}
{/snippet}

<div class="top-0 z-50 pb-2 sm:pb-0">
  <div class="navbar xl:w-7xl mx-auto pb-0 pl-0 sm:pb-2 sm:pl-2">
    <div class="navbar-start">
      <a class="flex items-center justify-start gap-2" href="/static">
        <Logo class="h-10 w-10" />
        <span class="text-2xl font-bold">logdash</span>
      </a>
    </div>

    <div class="navbar-center hidden truncate font-mono text-sm sm:block">
      {@render navBreadcrumb()}
    </div>

    <div class="navbar-end">
      <NavContextMenu />
    </div>
  </div>

  <div class="px-1 sm:hidden">
    {@render navBreadcrumb()}
  </div>
</div>
