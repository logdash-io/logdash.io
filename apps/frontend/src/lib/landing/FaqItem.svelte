<script lang="ts">
  import PlusMinusIcon from '$lib/domains/shared/icons/PlusMinusIcon.svelte';
  import { Collapse } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';

  type Props = {
    question: string;
    open?: boolean;
    children: Snippet;
  };

  const { question, open = false, children }: Props = $props();
</script>

<Collapse
  class="rounded-none select-none"
  titleClass="group/question flex items-center justify-between gap-6 px-0 py-5 text-base font-medium text-pretty"
  contentClass="text-neutral-400 px-0 pr-10 text-base"
  {open}
>
  {#snippet title()}
    {question}

    <PlusMinusIcon
      class="text-neutral-500 group-hover/question:text-fg-default in-open:text-fg-default transition-ink mr-1 size-4 shrink-0"
    />
  {/snippet}

  {@render children()}
</Collapse>
