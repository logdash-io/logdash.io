<script lang="ts">
  import { page } from '$app/state';
  import { reportOAuthPopupResult } from '$lib/domains/auth/application/start-oauth-popup';
  import { createOAuthPopupMessage } from '$lib/domains/auth/domain/oauth-popup-message';
  import { onMount } from 'svelte';

  const message = $derived(
    createOAuthPopupMessage(
      page.url.searchParams.get('status'),
      page.url.searchParams.get('reason'),
    ),
  );

  onMount(() => {
    reportOAuthPopupResult(message);
  });
</script>

<div class="flex min-h-dvh w-full items-center justify-center p-8">
  <p class="text-neutral-400 max-w-xs text-center text-sm text-balance">
    {#if message.status === 'ok'}
      You're signed in. You can close this window.
    {:else}
      Signing in did not go through. You can close this window and try again.
    {/if}
  </p>
</div>
