<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  const {
    class: className = '',
    style = '',
  }: { class?: ClassValue; style?: string } = $props();
</script>

<svg
  class={className}
  {style}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C12.55 22 13 21.55 13 21V20.75C13 20.44 13.11 20.16 13.31 19.95C13.56 19.69 13.92 19.56 14.31 19.63C14.58 19.69 14.87 19.72 15.16 19.72C17.39 19.72 19.2 17.91 19.2 15.68C19.2 15.43 19.18 15.18 19.14 14.94C19.05 14.5 19.18 14.09 19.48 13.81C19.74 13.56 20.1 13.42 20.46 13.42H21C21.55 13.42 22 12.97 22 12.42C22 6.49 17.51 2 12 2Z"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
  <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" />
  <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" />
</svg>
