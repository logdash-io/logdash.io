<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Button } from '@logdash/hyper-ui/presentational';

  const isApp = $derived(page.url.pathname.startsWith('/app'));
</script>

<svelte:head>
  <title>{page.error?.message} | Logdash</title>
</svelte:head>

<div
  class={[
    'flex w-full flex-col items-center justify-center gap-3 px-5 text-center',
    isApp ? 'min-h-dvh' : 'min-h-[70dvh]',
  ]}
>
  <p class="text-fg-muted font-mono text-xs">{page.status}</p>
  <h1 class="text-2xl font-medium tracking-[-0.02em] text-balance">
    {page.error?.message}
  </h1>
  <Button
    size="sm"
    class="mt-3"
    href={isApp ? resolve('/app/domains') : resolve('/')}
  >
    {isApp ? 'All domains' : 'Back home'}
  </Button>
</div>
