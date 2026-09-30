<script lang="ts">
  import type { ClassValue } from 'svelte/elements';
  type Props = {
    class?: ClassValue;
  };

  const { class: className = '' }: Props = $props();
</script>

<svg
  class={className}
  viewBox="0 0 16 16"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path d="M3.75 12.75v-3.5M8 12.75v-9.5M12.25 12.75v-6" />
</svg>
