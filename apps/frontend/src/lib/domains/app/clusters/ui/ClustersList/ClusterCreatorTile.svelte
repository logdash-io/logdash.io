<script lang="ts">
  import { resolve } from '$app/paths';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import RocketIcon from '$lib/domains/shared/icons/RocketIcon.svelte';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';

  type Props = {
    canAddMore: boolean;
  };

  const { canAddMore }: Props = $props();

  const ROW_CLASS =
    'text-neutral-500 hover:bg-surface-100 hover:text-fg-default focus-visible:outline-brand flex h-11 w-full cursor-pointer items-center gap-2 px-4 text-left text-sm focus-visible:-outline-offset-2 focus-visible:outline-2';

  const posthog = getContext<PostHog | undefined>('posthog');

  function onUpgrade(): void {
    posthog?.capture('upgrade_button_clicked', {
      source: 'cluster-limit',
      timestamp: new Date().toISOString(),
    });
    upgradeState.openModal('cluster-limit');
  }
</script>

{#if canAddMore}
  <a
    href={resolve('/app/domains/new')}
    class={ROW_CLASS}
    data-posthog-id="create-cluster-button"
  >
    <PlusIcon class="size-4 shrink-0 text-neutral-600" />
    Add domain
  </a>
{:else}
  <button type="button" class={ROW_CLASS} onclick={onUpgrade}>
    <RocketIcon class="size-4 shrink-0 text-neutral-600" />
    Upgrade your plan to add more services
  </button>
{/if}
