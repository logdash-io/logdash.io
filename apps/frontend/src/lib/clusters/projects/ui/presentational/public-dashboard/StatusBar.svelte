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
  }

  let { status }: Props = $props();

  const statusColors = {
    up: 'from-green-600 via-green-600/80 to-green-600',
    healthy: 'from-green-600 via-green-600/80 to-green-600',
    degraded: 'from-yellow-600 via-yellow-600/80 to-yellow-600',
    down: 'from-red-700 via-red-700/80 to-red-700',
    unhealthy: 'from-red-700 via-red-700/80 to-red-700',
    unknown: 'from-neutral-700 via-neutral-700/80 to-neutral-700',
  };

  const colorClass = $derived(statusColors[status] || statusColors.unknown);
</script>

<div class={`h-6 w-2 flex-shrink-0 pl-0.5 hover:h-6`}>
  <div class={`rounded-xs h-full bg-gradient-to-b ${colorClass}`}></div>
</div>
