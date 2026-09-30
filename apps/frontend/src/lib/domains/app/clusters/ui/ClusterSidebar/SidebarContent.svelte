<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import SidebarLayout from './SidebarLayout.svelte';
  import SidebarProjects from './SidebarProjects.svelte';
  import SidebarUserProfile from './SidebarUserProfile.svelte';

  type Props = {
    showLogo?: boolean;
  };
  const { showLogo = true }: Props = $props();

  const LIST_FADE_PX = 24;

  let list = $state<HTMLElement | null>(null);

  $effect(() => {
    void page.url.pathname;

    if (list) {
      revealActiveRow(list);
    }
  });

  function revealActiveRow(element: HTMLElement): void {
    const row = element.querySelector('[aria-current="page"]');

    if (!row) {
      return;
    }

    const listBox = element.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const visibleBottom = listBox.bottom - LIST_FADE_PX;

    if (rowBox.top < listBox.top) {
      element.scrollTop -= listBox.top - rowBox.top;
    } else if (rowBox.bottom > visibleBottom) {
      element.scrollTop += rowBox.bottom - visibleBottom;
    }
  }
</script>

<SidebarLayout
  homeHref={resolve('/app/domains')}
  homeActive={page.url.pathname === '/app/domains'}
  {showLogo}
  addDomainHref={clustersState.canAddDomain
    ? resolve('/app/domains/new')
    : undefined}
  onAddDomain={() => upgradeState.openModal('cluster-limit')}
  bind:list
>
  <SidebarProjects />

  {#snippet footer()}
    <SidebarUserProfile />
  {/snippet}
</SidebarLayout>
