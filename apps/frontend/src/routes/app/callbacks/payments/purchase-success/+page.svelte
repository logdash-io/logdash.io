<script lang="ts">
  import { resolve } from '$app/paths';
  import { cubicInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import {
    Button,
    Card,
    CardActions,
    CardBody,
    CardTitle,
  } from '@logdash/hyper-ui/presentational';
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
  class="bg-surface-root flex min-h-screen w-full items-center justify-center"
>
  <Card class="ld-card-base w-96">
    <CardBody class="items-center gap-4 p-6 text-center">
      <CardTitle class="text-3xl font-bold">Success 🎉</CardTitle>
      <p class="text-neutral-400">
        Thank you for your trust in our service. We'll be in touch shortly.
      </p>

      <CardActions class="w-full justify-center gap-2 rounded-xl">
        <Button href={resolve('/app/clusters')} variant="primary" size="sm">
          Continue
        </Button>
      </CardActions>
    </CardBody>
  </Card>
</div>
