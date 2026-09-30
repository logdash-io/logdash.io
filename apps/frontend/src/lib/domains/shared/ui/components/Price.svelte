<script lang="ts">
  type Props = {
    price: string;
  };

  const { price }: Props = $props();

  const amount = $derived(price.match(/^\$\d+/)?.[0] ?? '');
  const parts = $derived(
    [
      { text: amount, figure: true },
      { text: price.slice(amount.length), figure: false },
    ].filter((part) => part.text),
  );
</script>

{#each parts as part (part.figure)}
  <span class={{ 'font-figure': part.figure }}>{part.text}</span>
{/each}
