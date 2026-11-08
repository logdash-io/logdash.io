<script lang="ts">
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
  import type { PageProps } from './$types';

  const { data, form }: PageProps = $props();

  const scopeLabel = (scope: string): string =>
    scope === 'webAnalytics:write'
      ? 'Read your analytics and manage your saved insights'
      : 'Read your analytics';
</script>

<svelte:head>
  <title>Authorize access | Logdash</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
  <div class="flex w-full max-w-md flex-col gap-5">
    <div class="flex flex-col items-center gap-3 text-center">
      <div class="bg-surface-150-bg rounded-lg p-3">
        <KeyIcon class="text-brand size-6 stroke-1" />
      </div>
      {#if data.consent}
        <h1 class="text-xl font-medium">
          Authorize {data.consent.clientName}
        </h1>
        <p class="text-fg-tertiary text-sm">
          {data.consent.clientName} wants to access your Logdash web analytics.
        </p>
      {:else}
        <h1 class="text-xl font-medium">Authorize access</h1>
      {/if}
    </div>

    {#if data.consent}
      <div class="bg-surface-100-bg edge flex flex-col gap-2 rounded-lg p-4">
        {#each data.consent.scopes as scope (scope)}
          <p class="text-sm">{scopeLabel(scope)}</p>
        {/each}
        <p class="text-fg-tertiary text-sm">All domains</p>
      </div>

      <p class="text-fg-tertiary text-center text-xs">
        The code returns to {data.consent.redirectHost}. You can revoke access
        from API keys at any time.
      </p>

      {#if form?.error}
        <p class="text-error text-sm">{form.error}</p>
      {/if}

      <div class="flex flex-col gap-2">
        <form method="POST" action="?/approve">
          <input
            type="hidden"
            name="consentId"
            value={data.consent.consentId}
          />
          <Button type="submit" variant="primary" block>Approve</Button>
        </form>
        <form method="POST" action="?/deny">
          <input
            type="hidden"
            name="consentId"
            value={data.consent.consentId}
          />
          <Button type="submit" variant="ghost" block>Decline</Button>
        </form>
      </div>
    {:else}
      <p class="text-error text-center text-sm">{data.error}</p>
    {/if}
  </div>
</div>
