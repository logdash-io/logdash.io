<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import {
    cliAuthErrorMessage,
    type CliAuthRequest,
  } from '$lib/domains/app/personal-api-keys/domain/cli-auth.js';
  import PersonalApiKeyCreateModal from '$lib/domains/app/personal-api-keys/ui/PersonalApiKeyCreateModal.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';

  let userCode = $state('');
  let checking = $state(false);
  let error = $state<string | null>(null);
  let request = $state<CliAuthRequest | null>(null);

  // The access picker reads clusters/projects from clustersState. This page
  // lives outside the /app/clusters layout, so load them on the client.
  $effect(() => {
    if (!clustersState.ready) {
      clustersState.load();
    }
  });

  async function onLookup(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (userCode.trim() === '') {
      return;
    }

    checking = true;
    error = null;

    try {
      const response = await fetch('/app/api/user/cli-auth/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode: userCode.trim() }),
      });

      if (!response.ok) {
        error = cliAuthErrorMessage(response.status);
        return;
      }

      request = await response.json();
    } catch (cause) {
      error = cliAuthErrorMessage(0);
      console.error(cause);
    } finally {
      checking = false;
    }
  }

  function onClose(): void {
    request = null;
    void goto(resolve('/app/account/api-keys'));
  }
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
  <div class="flex w-full max-w-md flex-col items-center gap-3 text-center">
    <div class="bg-base-100 rounded-lg p-3">
      <KeyIcon class="text-primary size-6" />
    </div>
    <h1 class="text-xl font-semibold">Authorize CLI access</h1>
    <p class="text-neutral-400 text-sm">
      Type the code shown in your terminal. We never fill it in for you — if
      someone sent you a link with a code already in it, close this page.
    </p>

    <form class="mt-2 flex w-full flex-col gap-3" onsubmit={onLookup}>
      <input
        bind:value={userCode}
        class="input w-full text-center font-mono text-lg tracking-widest uppercase"
        placeholder="XXXX-XXXX"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        maxlength="16"
        aria-label="Code from your terminal"
      />

      {#if error}
        <p class="text-error text-sm">{error}</p>
      {/if}

      <button
        type="submit"
        class="btn btn-primary w-full"
        disabled={checking || userCode.trim() === ''}
      >
        {#if checking}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          Continue
        {/if}
      </button>
    </form>
  </div>

  <PersonalApiKeyCreateModal
    isOpen={request !== null}
    mode="cli"
    cliRequest={request}
    initialPreset="cli"
    {onClose}
  />
</div>
