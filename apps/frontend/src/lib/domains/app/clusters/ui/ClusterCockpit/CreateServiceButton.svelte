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

<button
  type="button"
  onclick={onOpenForm}
  aria-expanded={isFormOpen}
  aria-label="New service"
  title="New service"
  class={[
    'hover:bg-surface-100-hover-bg hover:text-fg-default focus-visible:outline-brand flex size-7 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2',
    isFormOpen ? 'bg-surface-150-bg text-fg-default' : 'text-fg-tertiary',
  ]}
>
  <PlusIcon class="size-4" />
</button>

{#if isFormOpen}
  <div class="absolute inset-y-0 right-0 w-full sm:w-96">
    <CreateServiceDropdown {clusterId} onClose={onCloseForm} />
  </div>
{/if}
