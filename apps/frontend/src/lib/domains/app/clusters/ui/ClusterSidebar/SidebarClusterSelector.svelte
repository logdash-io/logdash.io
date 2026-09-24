<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { ChevronsUpDownIcon } from 'lucide-svelte';

  const isWizardMode = $derived(wizardState.isActive);

  const currentCluster = $derived(
    isWizardMode
      ? clustersState.get(wizardState.tempClusterId)
      : clustersState.get(page.params.cluster_id),
  );
  const clusterColor = $derived(currentCluster?.color);
  const clusterName = $derived(currentCluster?.name || 'No project selected');
  const isDisabled = false;

  function onClusterSelect(clusterId: string, close: () => void): void {
    const cluster = clustersState.get(clusterId);
    const firstProjectId = cluster?.projects?.[0]?.id;
    if (firstProjectId) {
      void goto(
        resolve('/app/clusters/[cluster_id]/[project_id]', {
          cluster_id: clusterId,
          project_id: firstProjectId,
        }),
      );
    } else {
      void goto(
        resolve('/app/clusters/[cluster_id]', { cluster_id: clusterId }),
      );
    }
    close();
  }

  function onWizardProjectClick(): void {
    wizardState.scrollToSection('project');
  }

  function onCreateProject(close: () => void): void {
    close();
    void goto(resolve('/app/clusters/new'));
  }
</script>

{#snippet clusterDropdownMenu(close: () => void)}
  <div
    class="dropdown-content ld-card-base z-1 w-full rounded-xl p-1 whitespace-nowrap shadow-lg"
  >
    <p class="text-neutral-500 px-2.5 py-2 text-xs">Select project</p>
    <ul class="flex flex-col gap-0.5">
      {#each clustersState.clusters as cluster (cluster.id)}
        {@const isActive = cluster.id === page.params.cluster_id}
        <li>
          <button
            onclick={() => onClusterSelect(cluster.id, close)}
            class={[
              'flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-sm',
              {
                'bg-surface-root-selected': isActive,
                'hover:bg-surface-root-hover': !isActive,
              },
            ]}
          >
            <CubeIcon class="h-4 w-4 shrink-0" />
            <span class={[{ 'font-medium': isActive }]}>
              {cluster.name}
            </span>
          </button>
        </li>
      {/each}
    </ul>
    <div class="border-hairline mt-1 border-t pt-1">
      <button
        onclick={() => onCreateProject(close)}
        class="hover:bg-surface-root-hover flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-sm"
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
      'group flex h-9 w-full items-center gap-2 rounded-lg px-1.5 select-none',
      {
        'hover:bg-surface-root-hover cursor-pointer': !isDisabled,
        'cursor-not-allowed pointer-events-none': isDisabled,
      },
    ]}
  >
    {#if clusterColor}
      <span
        class="flex size-6 shrink-0 items-center justify-center rounded-md"
        style="background-color: {clusterColor}20; border: 1px solid {clusterColor}10"
      >
        <CubeIcon class="size-3.5 shrink-0" style="color: {clusterColor}" />
      </span>
    {:else}
      <span
        class="border-base-100 bg-base-200 flex size-6 shrink-0 items-center justify-center rounded-md border"
      >
        <CubeIcon class="size-3.5 shrink-0" />
      </span>
    {/if}

    <span class="truncate text-sm font-medium">{clusterName}</span>

    {#if !isWizardMode}
      <ChevronsUpDownIcon
        class="text-neutral-600 group-hover:text-neutral-400 ml-auto size-3.5 shrink-0 transition-ink duration-150"
      />
    {/if}
  </button>
{/snippet}

<div>
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
