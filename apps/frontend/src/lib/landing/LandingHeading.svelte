<script lang="ts">
  import type { Snippet } from 'svelte';
  import LandingSection from './LandingSection.svelte';

  type Props = {
    id?: string;
    title: string;
    quiet?: string;
    description?: string;
    dividerTop?: boolean;
    children?: Snippet;
  };

  const {
    id,
    title,
    quiet,
    description,
    dividerTop = false,
    children,
  }: Props = $props();
</script>

<LandingSection {id} {dividerTop}>
  <header
    class="flex flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-10 lg:py-28"
  >
    <h2
      class="max-w-4xl text-4xl leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-5xl"
    >
      <span class={{ 'sm:block': quiet }}>{title}</span>
      {#if quiet}
        <span class="text-neutral-600 sm:block">{quiet}</span>
      {/if}
    </h2>

    {#if description}
      <p class="text-neutral-400 mt-5 max-w-2xl text-lg text-pretty">
        {description}
      </p>
    {/if}

    {@render children?.()}
  </header>
</LandingSection>
