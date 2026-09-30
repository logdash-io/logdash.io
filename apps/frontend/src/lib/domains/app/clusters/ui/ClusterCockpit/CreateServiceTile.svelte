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

<div class="relative flex">
  <button
    type="button"
    onclick={onOpenForm}
    aria-expanded={isFormOpen}
    class={[
      'hover:bg-surface-100 hover:text-fg-default focus-visible:outline-brand flex w-full cursor-pointer items-start p-4 text-left text-sm focus-visible:-outline-offset-2 focus-visible:outline-2',
      isFormOpen
        ? 'bg-surface-100 text-fg-default'
        : 'bg-surface-elevated text-neutral-500',
    ]}
  >
    <span class="flex h-6 items-center gap-2">
      <PlusIcon class="size-4 shrink-0 text-neutral-600" />
      New service
    </span>
  </button>

  {#if isFormOpen}
    <CreateServiceDropdown {clusterId} onClose={onCloseForm} />
  {/if}
</div>
