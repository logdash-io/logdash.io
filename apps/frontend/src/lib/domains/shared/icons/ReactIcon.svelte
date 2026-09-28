<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
  };

  const { class: className }: Props = $props();
</script>

<svg
  class={className}
  viewBox="-11.5 -10.23174 23 20.46348"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle r="2.05" fill="#61DAFB" />
  <g stroke="#61DAFB" stroke-width="1" fill="none">
    <ellipse rx="11" ry="4.2" />
    <ellipse rx="11" ry="4.2" transform="rotate(60)" />
    <ellipse rx="11" ry="4.2" transform="rotate(120)" />
  </g>
</svg>
