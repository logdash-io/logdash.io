<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.error?.message}</title>
</svelte:head>

<div
  class="flex min-h-dvh flex-col items-center justify-center gap-3 px-5 text-center"
>
  <p class="text-fg-muted font-mono text-xs">{page.status}</p>
  <h1 class="text-2xl font-medium tracking-[-0.02em] text-balance">
    {page.error?.message}
  </h1>
</div>
