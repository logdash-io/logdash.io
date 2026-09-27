<script lang="ts">
  import type { ClassValue } from 'svelte/elements';
  import FaqAsk from './FaqAsk.svelte';
  import FaqItem from './FaqItem.svelte';
  import type { DocFaqItem } from './guides/documentation.data';

  type Props = {
    faqs: DocFaqItem[];
    class?: ClassValue;
  };

  const { faqs, class: className }: Props = $props();
</script>

<div class={['divide-hairline flex flex-col divide-y', className]}>
  {#each faqs as faq (faq.question)}
    <FaqItem question={faq.question}>{@render answer(faq.answer)}</FaqItem>
  {/each}

  <FaqAsk />
</div>

{#snippet answer(text: string)}
  {#each text.split('`') as part, index (index)}
    {#if index % 2}
      <code
        class="bg-surface-elevated text-neutral-300 rounded px-1 py-0.5 font-mono text-[0.875em]"
      >
        {part}
      </code>
    {:else}
      {part}
    {/if}
  {/each}
{/snippet}
