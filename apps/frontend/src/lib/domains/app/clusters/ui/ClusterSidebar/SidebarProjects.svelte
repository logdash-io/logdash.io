<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import type { Cluster } from '$lib/domains/app/clusters/domain/cluster.js';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import ProjectTile from './ProjectTile.svelte';
  import SidebarClusterNav from './SidebarClusterNav.svelte';
  import SidebarServicesList from './SidebarServicesList.svelte';

  const LIST_FADE_PX = 24;

  let listElement = $state<HTMLElement | null>(null);
  let collapsedClusterId = $state<string | null>(null);

  const isWizardMode = $derived(wizardState.isActive);
  const openClusterId = $derived(
    isWizardMode ? wizardState.tempClusterId : page.params.cluster_id,
  );

  $effect(() => {
    void page.url.pathname;

    if (listElement) {
      revealActiveRow(listElement);
    }
  });

  function revealActiveRow(list: HTMLElement): void {
    const row = list.querySelector('[aria-current="page"]');

    if (!row) {
      return;
    }

    const listBox = list.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const visibleBottom = listBox.bottom - LIST_FADE_PX;

    if (rowBox.top < listBox.top) {
      list.scrollTop -= listBox.top - rowBox.top;
    } else if (rowBox.bottom > visibleBottom) {
      list.scrollTop += rowBox.bottom - visibleBottom;
    }
  }

  function isExpanded(clusterId: string): boolean {
    return clusterId === openClusterId && clusterId !== collapsedClusterId;
  }

  function onProjectClick(clusterId: string): void {
    if (clusterId === openClusterId) {
      collapsedClusterId = isExpanded(clusterId) ? clusterId : null;
      return;
    }

    void goto(resolve('/app/clusters/[cluster_id]', { cluster_id: clusterId }));
  }
</script>

<nav
  bind:this={listElement}
  class="flex min-h-0 flex-col gap-px overflow-y-auto pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%_-_1.5rem),transparent)]"
  aria-label="Projects"
>
  <div
    class="group text-neutral-500 flex h-7 shrink-0 items-center justify-between px-2 text-xs"
  >
    <span>Projects</span>
    <a
      href={resolve('/app/clusters/new')}
      class="hover:bg-surface-hover hover:text-fg-default flex size-5 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
      aria-label="New project"
      title="New project"
    >
      <PlusIcon class="size-3.5" />
    </a>
  </div>

  {#each clustersState.clusters as cluster (cluster.id)}
    {@render projectRow(cluster)}

    {#if isExpanded(cluster.id)}
      <SidebarClusterNav />
      <div class="border-hairline my-1 ml-8 shrink-0 border-t"></div>
      <SidebarServicesList />
    {/if}
  {/each}
</nav>

{#snippet projectRow(cluster: Cluster)}
  {@const expanded = isExpanded(cluster.id)}
  <button
    class="group text-neutral-400 hover:bg-surface-hover hover:text-fg-default flex h-7 w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-[13px] select-none pointer-coarse:h-9"
    aria-expanded={cluster.id === openClusterId ? expanded : undefined}
    onclick={() => onProjectClick(cluster.id)}
  >
    <ProjectTile name={cluster.name} color={cluster.color} />
    <span class="truncate">{cluster.name}</span>
    {#if expanded}
      <ChevronDownIcon
        class="text-neutral-600 group-hover:text-neutral-400 size-3 shrink-0"
      />
    {:else}
      <ChevronRightIcon
        class="text-neutral-600 group-hover:text-neutral-400 size-3 shrink-0"
      />
    {/if}
  </button>
{/snippet}
