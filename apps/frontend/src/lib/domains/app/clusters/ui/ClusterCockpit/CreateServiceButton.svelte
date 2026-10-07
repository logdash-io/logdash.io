<script lang="ts">
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { TOOLBAR_PRIMARY } from '$lib/domains/shared/ui/components/toolbar.js';
  import CreateServiceDropdown from './CreateServiceDropdown.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  let isFormOpen = $state(false);
</script>

<div class="relative">
  <button
    type="button"
    onclick={() => (isFormOpen = true)}
    aria-expanded={isFormOpen}
    class={TOOLBAR_PRIMARY}
  >
    <PlusIcon class="size-4" />
    New service
  </button>

  {#if isFormOpen}
    <CreateServiceDropdown {clusterId} onClose={() => (isFormOpen = false)} />
  {/if}
</div>
