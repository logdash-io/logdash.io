<script lang="ts">
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
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

<div
  class="col-span-full flex flex-col items-center justify-center py-12 gap-4"
>
  <CubeIcon class="size-12 text-surface-100" />
  <div class="flex flex-col items-center gap-1">
    <h3 class="text-lg font-medium">No services yet</h3>
    <p class="text-neutral-400 text-sm">
      Create your first service to get started
    </p>
  </div>
  <div class="relative">
    <Button
      variant="primary"
      size="sm"
      class={[
        {
          'ring-2 ring-neutral-500 ring-offset-2 ring-offset-surface-elevated':
            isFormOpen,
        },
      ]}
      onclick={onOpenForm}
    >
      <PlusIcon class="size-4" />
      Create first service
    </Button>

    {#if isFormOpen}
      <CreateServiceDropdown
        {clusterId}
        onClose={onCloseForm}
        inputId="empty-state-service-name-input"
      />
    {/if}
  </div>
</div>
