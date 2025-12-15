<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    children: Snippet;
    class?: ClassValue;
  }

  let { children, class: className = 'max-w-2xl' }: Props = $props();
</script>

<div
  class={[
    'ld-card-base bg-neutral text-neutral-content mx-2 rounded-3xl p-8 text-base shadow-xl sm:mx-auto',
    className,
  ]}
>
  {@render children()}

  <div
    class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8"
  >
    <div class="flex items-center gap-4">
      <img
        src="/images/founders/olo.webp"
        alt="Aleksander Blaszkiewicz"
        class="h-12 w-12 rounded-full"
      />
      <div class="text-left">
        <p class="font-medium">Aleksander Blaszkiewicz</p>
        <p class="text-sm">Co-founder</p>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <img
        src="/images/founders/simon.webp"
        alt="Simon Gracki"
        class="h-12 w-12 rounded-full"
      />
      <div class="text-left">
        <p class="font-medium">Simon Gracki</p>
        <p class="text-sm">Co-founder</p>
      </div>
    </div>
  </div>
</div>
