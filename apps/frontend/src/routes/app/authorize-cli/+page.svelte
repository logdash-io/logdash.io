<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import {
    cliAuthErrorMessage,
    type CliAuthRequest,
  } from '$lib/domains/app/personal-api-keys/domain/cli-auth.js';
  import PersonalApiKeyCreateModal from '$lib/domains/app/personal-api-keys/ui/PersonalApiKeyCreateModal.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import { Button, Input } from '@logdash/hyper-ui/presentational';

  let userCode = $state('');
  let checking = $state(false);
  let error = $state<string | null>(null);
  let request = $state<CliAuthRequest | null>(null);

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

      request = (await response.json()) as CliAuthRequest;
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

<svelte:head>
  <title>Authorize CLI | Logdash</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
  <div class="flex w-full max-w-md flex-col items-center gap-3 text-center">
    <div class="bg-surface-150-bg rounded-lg p-3">
      <KeyIcon class="text-brand size-6 stroke-1" />
    </div>
    <h1 class="text-xl font-medium">Authorize CLI access</h1>
    <p class="text-fg-tertiary text-sm">
      Type the code shown in your terminal. We never fill it in for you. If
      someone sent you a link with a code already in it, close this page.
    </p>

    <form class="mt-2 flex w-full flex-col gap-3" onsubmit={onLookup}>
      <Input
        bind:value={userCode}
        class="w-full text-center font-mono text-lg tracking-widest uppercase"
        placeholder="XXXX-XXXX"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        maxlength={16}
        aria-label="Code from your terminal"
      />

      {#if error}
        <p class="text-error text-sm">{error}</p>
      {/if}

      <Button
        type="submit"
        variant="primary"
        block
        disabled={userCode.trim() === ''}
        loading={checking}
      >
        Continue
      </Button>
    </form>
  </div>

  <PersonalApiKeyCreateModal
    isOpen={request !== null}
    mode="cli"
    cliRequest={request}
    {onClose}
  />
</div>
