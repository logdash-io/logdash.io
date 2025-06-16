<script lang="ts">
  type Status = 'up' | 'down' | 'degraded' | 'unknown';

  interface Props {
    status: Status;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
  }

  let { status, size = 'md', showText = false }: Props = $props();

  const statusConfig = {
    up: {
      color: 'bg-green-600',
      text: 'Operational',
      textColor: 'text-green-600',
    },
    down: {
      color: 'bg-red-500',
      text: 'Down',
      textColor: 'text-red-600',
    },
    degraded: {
      color: 'bg-yellow-500',
      text: 'Degraded',
      textColor: 'text-yellow-600',
    },
    unknown: {
      color: 'bg-gray-400',
      text: 'Unknown',
      textColor: 'text-gray-600',
    },
  };

  const sizeConfig = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  const config = $derived(statusConfig[status]);
  const sizeClass = $derived(sizeConfig[size]);
</script>

<div class="flex items-center gap-2">
  <div class={`rounded-full ${config.color} ${sizeClass}`}></div>
  {#if showText}
    <span class={`text-sm font-medium ${config.textColor}`}>
      {config.text}
    </span>
  {/if}
</div>
