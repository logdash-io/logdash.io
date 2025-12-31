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
      'ld-card-base group flex w-full cursor-pointer flex-col items-center justify-center gap-2 ld-card-rounding transition-all hover:bg-base-100/50 h-full md:min-h-auto min-h-[110px]',
      { 'ring-2 ring-primary/50': isFormOpen },
    ]}
  >
    <div
      class={[
        'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
        {
          'bg-primary/20': isFormOpen,
          'bg-primary/10 group-hover:bg-primary/20': !isFormOpen,
        },
      ]}
    >
      <PlusIcon class="size-5 text-primary" />
    </div>
    <div class="flex flex-col items-center">
      <h3 class="font-semibold">Add new service</h3>
    </div>
  </button>

  {#if isFormOpen}
    <CreateServiceDropdown {clusterId} onClose={onCloseForm} />
  {/if}
</div>
