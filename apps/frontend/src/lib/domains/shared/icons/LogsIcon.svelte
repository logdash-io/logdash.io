<script lang="ts">
  import type { ClassValue } from 'svelte/elements';
  type Props = {
    class?: ClassValue;
  };

  const { class: className = '' }: Props = $props();
</script>

<svg
  class={className}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M8 2V5"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-miterlimit="10"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M16 2V5"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-miterlimit="10"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M7 13H15"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-miterlimit="10"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M7 17H12"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-miterlimit="10"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M16 3.5C19.33 3.68 21 4.95 21 9.65V15.83C21 19.95 20 22.01 15 22.01H9C4 22.01 3 19.95 3 15.83V9.65C3 4.95 4.67 3.69 8 3.5H16Z"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-miterlimit="10"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
