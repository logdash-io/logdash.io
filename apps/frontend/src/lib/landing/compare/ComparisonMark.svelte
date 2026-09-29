<script lang="ts">
  import MinusIcon from '$lib/domains/shared/icons/MinusIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';

  type Props = {
    good: boolean;
    text: string;
  };

  const { good, text }: Props = $props();
</script>

<div class="flex items-center gap-2">
  {#if good}
    <PlusIcon class="text-success size-4 shrink-0" />
  {:else}
    <MinusIcon class="text-error size-4 shrink-0" />
  {/if}
  {#if text}
    {text}
  {:else}
    <!-- An icon-only cell still needs words for screen readers and markdown twins. -->
    <span class="sr-only">{good ? 'Yes' : 'No'}</span>
  {/if}
</div>
