<script lang="ts">
  import { resolve } from '$app/paths';
  import { cubicInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { Button } from '@logdash/hyper-ui/presentational';
</script>

<div
  in:scale={{
    duration: 300,
    start: 1.1,
    easing: cubicInOut,
  }}
  out:scale={{
    duration: 300,
    start: 1.1,
    easing: cubicInOut,
  }}
  class="bg-surface-root-bg flex min-h-screen w-full items-center justify-center p-4"
>
  <section
    class="bg-surface-100-bg edge flex w-96 max-w-full flex-col items-center gap-4 rounded-2xl p-6 text-center"
  >
    <h1 class="text-3xl font-bold">Success 🎉</h1>
    <p class="text-fg-tertiary text-sm">
      Thank you for your trust in our service. We'll be in touch shortly.
    </p>
    <Button href={resolve('/app/domains')} variant="primary" size="sm">
      Continue
    </Button>
  </section>
</div>
