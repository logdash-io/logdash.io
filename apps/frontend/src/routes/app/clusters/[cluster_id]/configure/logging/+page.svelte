<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import LoggingSetup from '$lib/domains/logs/ui/setup/LoggingSetup.svelte';
  import atomOneDark from 'svelte-highlight/styles/github-dark';
  import { fade } from 'svelte/transition';

  type Props = {
    data: { project_id: string; api_key: string };
  };
  const { data }: Props = $props();
  let tryingToClaim = $state(false);
</script>

<svelte:head>
  {@html atomOneDark}
</svelte:head>

{#snippet claimer(hasLogs: boolean)}
  <div class="mt-auto flex flex-1 items-center gap-4">
    <button
      onclick={() => {
        tryingToClaim = true;
        goto(
          `/app/clusters/${page.params.cluster_id}?project_id=${page.url.searchParams.get('project_id')}`,
          {
            invalidateAll: true,
          },
        );
      }}
      in:fade={{ duration: 100 }}
      class={['btn btn-primary flex-1 whitespace-nowrap']}
      disabled={!hasLogs}
      data-posthog-id="complete-setup-button"
    >
      {#if tryingToClaim}
        <span class="loading loading-xs"></span>
      {/if}
      Complete setup
    </button>
  </div>
{/snippet}

<LoggingSetup {claimer} {...data} />
