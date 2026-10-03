<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    label: string;
    controls: Snippet;
    children: Snippet;
  };

  const { label, controls, children }: Props = $props();

  function onSubmit(event: SubmitEvent): void {
    event.preventDefault();
  }
</script>

<section
  aria-label={label}
  class="border-hairline flex flex-col rounded-xl border"
>
  <form class="flex flex-col gap-5 p-5" onsubmit={onSubmit} novalidate>
    {@render controls()}
  </form>
  <div class="border-hairline flex flex-col gap-4 border-t p-5">
    {@render children()}
  </div>
</section>
