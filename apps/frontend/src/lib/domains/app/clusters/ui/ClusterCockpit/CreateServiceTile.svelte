<script lang="ts">
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import CreateServiceDropdown from './CreateServiceDropdown.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  let isFormOpen = $state(false);

  function onOpenForm(): void {
    isFormOpen = true;
  }

  function onCloseForm(): void {
    isFormOpen = false;
  }
</script>

<div class="relative">
  <button
    onclick={onOpenForm}
    class={[
      'text-neutral-400 hover:text-base-content flex h-full min-h-24 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-ink duration-150',
      isFormOpen ? 'border-neutral-600' : 'border-neutral-700',
    ]}
  >
    <PlusIcon class="size-4" />
    New service
  </button>

  {#if isFormOpen}
    <CreateServiceDropdown {clusterId} onClose={onCloseForm} />
  {/if}
</div>
