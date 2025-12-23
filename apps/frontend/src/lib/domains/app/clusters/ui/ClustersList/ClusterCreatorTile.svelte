<script lang="ts">
  import { goto } from '$app/navigation';
  import { Plus } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';

  type Props = {
    canAddMore: boolean;
    delayIn?: number;
  };
  const { canAddMore, delayIn }: Props = $props();

  function onCreateClick(): void {
    if (canAddMore) {
      goto('/app/clusters/new');
    }
  }
</script>

<div
  class="ld-card-base relative flex h-full max-h-32 w-full items-center justify-between gap-2 overflow-hidden ld-card-rounding"
  in:fly|global={{
    y: -5,
    duration: 400,
    delay: delayIn,
  }}
  style="min-height: calc(var(--spacing) * 24)"
>
  {#if canAddMore}
    <button
      class="absolute flex h-full w-full cursor-pointer items-center justify-between gap-2 px-8"
      role="button"
      onclick={onCreateClick}
      data-posthog-id="create-cluster-button"
    >
      <h5 class="text-lg font-semibold">Create new project</h5>

      <div class="badge badge-lg badge-soft badge-primary rounded-full">
        <Plus class="h-4 w-4" />
      </div>
    </button>
  {:else}
    <div class="flex w-full items-center justify-between gap-2 px-8">
      <UpgradeButton source="cluster-limit">
        Upgrade your plan to add more projects
      </UpgradeButton>
    </div>
  {/if}
</div>
