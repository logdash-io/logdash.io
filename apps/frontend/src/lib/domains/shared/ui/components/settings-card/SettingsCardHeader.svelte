<script lang="ts">
  type Props = {
    title: string;
    description?: string;
    icon?: any;
    variant?: 'default' | 'danger';
  };

  const {
    title,
    description,
    icon: Icon,
    variant = 'default',
  }: Props = $props();
</script>

<div
  class={[
    'border-b p-4 px-5',
    {
      'border-base-100': variant === 'default',
      'border-error/20 bg-error/5': variant === 'danger',
    },
  ]}
>
  <div class="flex items-center gap-2">
    {#if Icon}
      <Icon
        class={[
          'h-5 w-5',
          {
            'text-base-content/70': variant === 'default',
            'text-error': variant === 'danger',
          },
        ]}
      />
    {/if}
    <h2
      class={['text-lg font-semibold', { 'text-error': variant === 'danger' }]}
    >
      {title}
    </h2>
  </div>
  {#if description}
    <p class="text-base-content/60 text-sm">
      {description}
    </p>
  {/if}
</div>
