<script lang="ts">
  type StatusType =
    | "up"
    | "degraded"
    | "down"
    | "unknown"
    | "healthy"
    | "unhealthy";

  interface Props {
    status: StatusType;
  }

  let { status }: Props = $props();

  const statusColors = {
    up: "bg-green-600",
    healthy: "bg-green-600",
    degraded: "bg-yellow-600",
    down: "bg-red-700",
    unhealthy: "bg-red-700",
    unknown: "bg-neutral-700",
  };

  const colorClass = $derived(statusColors[status] || statusColors.unknown);
</script>

<div class={`h-6 mb-1 w-2 flex-shrink-0 pl-0.5 hover:h-8 hover:mb-0`}>
  <div class={`rounded-xs h-full ${colorClass}`}></div>
</div>
