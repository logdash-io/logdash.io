<script lang="ts">
  import { goto } from '$app/navigation';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import PersonalApiKeyCreateModal from '$lib/domains/app/personal-api-keys/ui/PersonalApiKeyCreateModal.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let modalOpen = $state(true);

  // The access picker reads clusters/projects from clustersState. This page
  // lives outside the /app/clusters layout, so load them on the client.
  $effect(() => {
    if (!clustersState.ready) {
      clustersState.load();
    }
  });

  function onClose(): void {
    modalOpen = false;
    goto('/app/account/api-keys');
  }
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
  <div class="flex flex-col items-center gap-3 text-center">
    <div class="bg-base-100 rounded-lg p-3">
      <KeyIcon class="text-primary size-6" />
    </div>
    <h1 class="text-xl font-semibold">Authorize CLI access</h1>
    <p class="text-base-content/70 max-w-md text-sm">
      A device is requesting access to your Logdash account. Confirm the code
      below matches the one shown in your terminal before approving.
    </p>
    {#if data.userCode}
      <div
        class="border-primary/40 bg-primary/10 rounded-lg border px-4 py-2 font-mono text-lg font-bold tracking-widest"
      >
        {data.userCode}
      </div>
    {/if}
  </div>

  <PersonalApiKeyCreateModal
    isOpen={modalOpen}
    mode="cli"
    userCode={data.userCode}
    initialPreset="cli"
    {onClose}
  />
</div>
