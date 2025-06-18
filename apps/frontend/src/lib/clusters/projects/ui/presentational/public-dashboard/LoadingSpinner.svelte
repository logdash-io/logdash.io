<script lang="ts">
  interface Props {
    message?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
  }

  let { message = 'Loading...', size = 'xs' }: Props = $props();

  const sizeClasses = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
  };

  const sizeClass = $derived(sizeClasses[size]);
</script>

<div class="flex h-64 items-center justify-center">
  <div class="flex items-center gap-3">
    <div class={`loading loading-spinner ${sizeClass}`}></div>
    <span class="text-lg text-gray-600 dark:text-gray-300">
      {message}
    </span>
  </div>
</div>
