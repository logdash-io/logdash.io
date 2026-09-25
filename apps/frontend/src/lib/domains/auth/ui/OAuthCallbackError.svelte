<script lang="ts">
  import { resolve } from '$app/paths';
  import { reportOAuthPopupFailure } from '$lib/domains/auth/application/start-oauth-popup';
  import { onMount } from 'svelte';

  onMount(() => {
    reportOAuthPopupFailure('login-failed');
  });
</script>

<div class="flex min-h-dvh w-full flex-col items-center justify-center px-4">
  <div class="flex max-w-96 flex-col gap-4 text-center">
    <h1 class="text-2xl font-medium">Oh snap!</h1>
    <p class="text-neutral-400 text-center">
      We are sorry, something went wrong on our end. Please try again later.
    </p>
    <a href={resolve('/')} class="btn btn-primary btn-sm mx-auto w-fit">
      Main page
    </a>
  </div>
</div>
