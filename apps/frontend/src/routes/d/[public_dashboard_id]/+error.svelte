<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
</script>

<div class="p-8 sm:p-32">
  <div class="ld-card mx-auto flex max-w-xl flex-col gap-4">
    <h1 class="text-xl">Aww snap! Something went wrong on our end.</h1>

    <div class="font-mono">
      <p>{page.error?.message}</p>
    </div>

    <div class="text-neutral-300 flex flex-col gap-2 text-sm">
      If you think this is a bug, please let us know by reporting it on our
      GitHub repository. We appreciate your help in making LogDash better!

      <Button
        href={resolve('/')}
        rel="noopener noreferrer"
        variant="primary"
        size="sm"
      >
        Go back to home
      </Button>

      <Button
        href="https://github.com/logdash-io/logdash.io/issues"
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        size="sm"
      >
        Report bug <OpenIcon class="inline h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
