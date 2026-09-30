<script lang="ts">
  type Props = {
    title: string;
    description?: string;
    variant?: 'default' | 'danger';
  };

  const { title, description, variant = 'default' }: Props = $props();
</script>

<div class="flex shrink-0 flex-col gap-1 px-4 pt-4 lg:w-72 lg:pb-4">
  <h2 class={['text-sm font-medium', { 'text-error': variant === 'danger' }]}>
    {title}
  </h2>
  {#if description}
    <p class="text-neutral-500 text-sm">{description}</p>
  {/if}
</div>
