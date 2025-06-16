<script lang="ts">
  type StatusType =
    | 'up'
    | 'degraded'
    | 'down'
    | 'unknown'
    | 'healthy'
    | 'unhealthy';

  interface Props {
    status: StatusType;
    interactive?: boolean;
  }

  let { status, interactive = true }: Props = $props();

  const statusColors = {
    up: 'from-green-600 via-green-600/80 to-green-600',
    healthy: 'from-green-600 via-green-600/80 to-green-600',
    degraded: 'from-orange-600 via-orange-600/80 to-orange-600',
    down: 'from-red-600 via-red-600/80 to-red-600',
    unhealthy: 'from-red-600 via-red-600/80 to-red-600',
    unknown: 'from-neutral-700 via-neutral-700/80 to-neutral-700',
  };

  const colorClass = $derived(statusColors[status] || statusColors.unknown);
  const hoverClass = $derived(interactive ? 'hover:h-6' : '');
</script>

<div class={`h-5 w-1.5 flex-shrink-0 pl-0.5 ${hoverClass}`}>
  <div class={`rounded-xs h-full bg-gradient-to-b ${colorClass}`}></div>
</div>
