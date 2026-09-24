<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
  };

  const { class: className = '' }: Props = $props();
</script>

<!-- Marks a link that leaves the site: a bare top-right arrow. -->
<svg
  class={className}
  viewBox="0 0 24 25"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path
    d="M6.33997 18.56L17.66 7.25"
    stroke="currentColor"
    stroke-width="2.7"
    stroke-miterlimit="10"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M9.04004 7.25H17.66V15.87"
    stroke="currentColor"
    stroke-width="2.7"
    stroke-miterlimit="10"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
