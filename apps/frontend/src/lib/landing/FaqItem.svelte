<script lang="ts">
  import PlusMinusIcon from '$lib/domains/shared/icons/PlusMinusIcon.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    question: string;
    open?: boolean;
    children: Snippet;
  };

  const { question, open = false, children }: Props = $props();
</script>

<details class="collapse rounded-none" {open}>
  <summary
    class="collapse-title group/question flex items-center justify-between gap-6 px-0 py-5 text-base font-medium"
  >
    {question}

    <PlusMinusIcon
      class="text-neutral-500 group-hover/question:text-base-content in-open:text-base-content transition-ink mr-1 size-4 shrink-0"
    />
  </summary>

  <div class="collapse-content text-neutral-400 px-0 pr-10 text-base">
    {@render children()}
  </div>
</details>
