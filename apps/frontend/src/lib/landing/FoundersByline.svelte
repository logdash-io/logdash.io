<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
  };

  const { class: className }: Props = $props();

  const FOUNDERS = [
    { name: 'Aleksander Blaszkiewicz', img: '/images/founders/olo.webp' },
    { name: 'Simon Gracki', img: '/images/founders/simon.webp' },
  ];
</script>

<div class={['flex items-center gap-3', className]}>
  <div class="flex -space-x-2">
    {#each FOUNDERS as founder (founder.name)}
      <img
        class="ring-base-300 size-9 rounded-full object-cover grayscale ring-2"
        src={founder.img}
        alt={founder.name}
        loading="lazy"
      />
    {/each}
  </div>

  <div class="flex flex-col text-left">
    <span class="text-sm font-medium">Aleksander & Simon</span>
    <span class="text-neutral-500 text-sm">Co-founders</span>
  </div>
</div>
