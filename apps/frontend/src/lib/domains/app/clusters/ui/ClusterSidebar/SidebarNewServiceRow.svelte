<script lang="ts">
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  type Props = {
    onclick?: () => void;
  };

  const { onclick }: Props = $props();
</script>

<SidebarMenuItem {onclick} class="pl-5 text-neutral-500">
  <PlusIcon class="size-4 shrink-0" />
  <span class="truncate">New service</span>
</SidebarMenuItem>
