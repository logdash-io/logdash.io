<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';

  const isWizardMode = $derived(wizardState.isActive);

  const currentCluster = $derived(
    isWizardMode
      ? clustersState.get(wizardState.tempClusterId)
      : clustersState.get(page.params.cluster_id),
  );
  const clusterColor = $derived(currentCluster?.color);
  const clusterName = $derived(currentCluster?.name || 'No project selected');
  const isDisabled = $derived(
    !isWizardMode && page.url.pathname === '/app/clusters',
  );

  function onClusterSelect(clusterId: string, close: () => void): void {
    const cluster = clustersState.get(clusterId);
    const firstProjectId = cluster?.projects?.[0]?.id;
    if (firstProjectId) {
      goto(`/app/clusters/${clusterId}/${firstProjectId}`);
    } else {
      goto(`/app/clusters/${clusterId}`);
    }
    close();
  }

  function onWizardProjectClick(): void {
    wizardState.scrollToSection('project');
  }

  function onCreateProject(close: () => void): void {
    close();
    goto('/app/clusters/new');
  }
</script>

{#snippet clusterDropdownMenu(close: () => void)}
  <div
    class="dropdown-content ld-card-base rounded-2xl z-1 w-full whitespace-nowrap p-1 shadow-lg"
  >
    <p class="px-3 py-2 text-xs text-base-content/50 font-medium">
      Select project
    </p>
    <ul class="flex flex-col gap-0.5">
      {#each clustersState.clusters as cluster}
        {@const isActive = cluster.id === page.params.cluster_id}
        <li>
          <button
            onclick={() => onClusterSelect(cluster.id, close)}
            class={[
              'flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
              {
                'bg-base-100': isActive,
                'hover:bg-base-100': !isActive,
              },
            ]}
          >
            <CubeIcon class="h-4 w-4 shrink-0" />
            <span class={[{ 'font-semibold': isActive }]}>
              {cluster.name}
            </span>
          </button>
        </li>
      {/each}
    </ul>
    <div class="border-t border-base-100 mt-1 pt-1">
      <button
        onclick={() => onCreateProject(close)}
        class="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-base-100"
      >
        <PlusIcon class="h-4 w-4 shrink-0" />
        <span>Create new project</span>
      </button>
    </div>
  </div>
{/snippet}

{#snippet selectorButton()}
  <button
    disabled={isDisabled}
    class={[
      'flex group items-center justify-between gap-1.5 rounded-lg p-1 pr-2 w-full select-none',
      {
        'cursor-pointer hover:bg-base-100': !isDisabled,
        'cursor-not-allowed opacity-50 pointer-events-none': isDisabled,
      },
    ]}
  >
    <span class="flex items-center gap-2 truncate font-medium">
      {#if clusterColor}
        <div
          class="size-7 rounded-md flex items-center justify-center"
          style="background-color: {clusterColor}20; border: 1px solid {clusterColor}10"
        >
          <CubeIcon class="size-4.5 shrink-0" style="color: {clusterColor}" />
        </div>
      {:else}
        <div
          class={[
            'size-7 rounded-md flex items-center justify-center',
            {
              'bg-primary/15 border border-primary/5': currentCluster,
            },
          ]}
        >
          <CubeIcon
            class={[
              'size-4.5 shrink-0',
              {
                'text-primary': currentCluster,
                'text-base-content/80': !currentCluster,
              },
            ]}
          />
        </div>
      {/if}
      {clusterName}
    </span>
    {#if !isWizardMode}
      <ChevronRightIcon
        class="size-4 shrink-0 text-base-content/50 group-hover:translate-x-0.5 transition-transform group-hover:text-base-content"
      />
    {/if}
  </button>
{/snippet}

<div class="mb-1">
  {#if isWizardMode}
    <button class="w-full" onclick={onWizardProjectClick}>
      {@render selectorButton()}
    </button>
  {:else if isDisabled}
    {@render selectorButton()}
  {:else}
    <Tooltip
      class="w-full"
      content={clusterDropdownMenu}
      interactive={true}
      placement="right"
      align="top"
      trigger="click"
      closeOnOutsideTooltipClick={true}
    >
      {@render selectorButton()}
    </Tooltip>
  {/if}
</div>
