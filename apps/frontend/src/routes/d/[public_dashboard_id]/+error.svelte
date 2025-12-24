<script lang="ts">
  import { page } from '$app/state';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
</script>

<div class="p-8 sm:p-32">
  <div class="ld-card mx-auto flex max-w-xl flex-col gap-4">
    <h1 class="text-xl">Aww snap! Something went wrong on our end.</h1>

    <div class="font-mono">
      <p>{page.error.message}</p>
    </div>

    <div class="text-secondary/80 flex flex-col gap-2 text-sm">
      If you think this is a bug, please let us know by reporting it on our
      GitHub repository. We appreciate your help in making LogDash better!

      <a href="/" rel="noopener noreferrer" class="btn btn-sm btn-primary">
        Go back to home
      </a>

      <a
        href="https://github.com/logdash-io/logdash.io/issues"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-sm btn-secondary"
      >
        Report bug <OpenIcon class="inline h-4 w-4" />
      </a>
    </div>
  </div>
</div>
