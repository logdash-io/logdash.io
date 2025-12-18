<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  export type ServiceStatus = 'healthy' | 'unhealthy' | 'degraded' | 'unknown';

  type ServiceData = {
    id: string;
    name: string;
    status: ServiceStatus;
  };

  type StatusGroup = {
    status: ServiceStatus;
    count: number;
    colorClass: string;
    serviceNames: string[];
  };

  type Props = {
    services: ServiceData[];
    size?: number;
    strokeWidth?: number;
    gapSize?: number;
    clusterId?: string;
    onServiceClick?: (serviceId: string) => void;
  };

  const {
    services,
    size = 120,
    strokeWidth = 8,
    gapSize = 6,
    clusterId,
    onServiceClick,
  }: Props = $props();

  const STATUS_COLORS: Record<ServiceStatus, string> = {
    healthy: 'stroke-success',
    unhealthy: 'stroke-error',
    degraded: 'stroke-warning',
    unknown: 'stroke-base-300',
  };

  const STATUS_LABELS: Record<ServiceStatus, string> = {
    healthy: 'Healthy',
    unhealthy: 'Unhealthy',
    degraded: 'Degraded',
    unknown: 'Unknown',
  };

  const radius = $derived((size - strokeWidth) / 2);
  const circumference = $derived(2 * Math.PI * radius);
  const center = $derived(size / 2);

  const statusGroups = $derived.by((): StatusGroup[] => {
    if (services.length === 0) {
      return [];
    }

    const groups: StatusGroup[] = [];

    for (const service of services) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.status === service.status) {
        lastGroup.count++;
        lastGroup.serviceNames.push(service.name);
      } else {
        groups.push({
          status: service.status,
          count: 1,
          colorClass: STATUS_COLORS[service.status],
          serviceNames: [service.name],
        });
      }
    }

    return groups;
  });

  const segments = $derived.by(() => {
    if (statusGroups.length === 0) {
      return [];
    }

    const numberOfGaps = statusGroups.length > 1 ? statusGroups.length : 0;
    const roundCapCompensation = strokeWidth * numberOfGaps;
    const totalGapLength = gapSize * numberOfGaps + roundCapCompensation;
    const availableLength = circumference - totalGapLength;
    const lengthPerService = availableLength / services.length;

    let currentOffset = 0;

    return statusGroups.map((group) => {
      const segmentLength = lengthPerService * group.count;
      const offset = currentOffset;
      const needsGap = statusGroups.length > 1;
      currentOffset += segmentLength + (needsGap ? gapSize + strokeWidth : 0);

      return {
        ...group,
        dashArray: `${segmentLength} ${circumference - segmentLength}`,
        dashOffset: -offset,
      };
    });
  });

  const hasServices = $derived(services.length > 0);
</script>

<div class="relative" style="width: {size}px; height: {size}px;">
  <svg
    width={size}
    height={size}
    class="-rotate-90 transform"
    viewBox="0 0 {size} {size}"
  >
    {#if hasServices}
      {#each segments as segment}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke-width={strokeWidth}
          stroke-linecap="round"
          class="{segment.colorClass} cursor-pointer transition-opacity hover:opacity-80"
          style="stroke-dasharray: {segment.dashArray}; stroke-dashoffset: {segment.dashOffset};"
        />
      {/each}
    {:else}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke-width={strokeWidth}
        stroke-dasharray="4 4"
        class="stroke-base-300"
      />
    {/if}
  </svg>

  {#if hasServices}
    <div class="absolute inset-0">
      {#each segments as segment, i}
        {@const segmentAngle = (segment.count / services.length) * 360}
        {@const previousSegmentsCount = segments
          .slice(0, i)
          .reduce((acc, s) => acc + s.count, 0)}
        {@const startAngle =
          (previousSegmentsCount / services.length) * 360 - 90}
        {@const midAngle = startAngle + segmentAngle / 2}
        {@const hitAreaRadius = radius}
        {@const hitX =
          center + hitAreaRadius * Math.cos((midAngle * Math.PI) / 180)}
        {@const hitY =
          center + hitAreaRadius * Math.sin((midAngle * Math.PI) / 180)}
        {#snippet segmentTooltipContent()}
          <div class="flex flex-col gap-1 p-1">
            <div class="text-xs font-medium">
              {STATUS_LABELS[segment.status]} ({segment.count})
            </div>
            <div class="flex flex-col gap-0.5">
              {#each segment.serviceNames as serviceName}
                <span class="text-xs text-base-content/70">{serviceName}</span>
              {/each}
            </div>
          </div>
        {/snippet}
        <Tooltip content={segmentTooltipContent} placement="top">
          <div
            class="absolute cursor-pointer"
            style="
              left: {hitX - strokeWidth}px;
              top: {hitY - strokeWidth}px;
              width: {strokeWidth * 2}px;
              height: {strokeWidth * 2}px;
            "
          ></div>
        </Tooltip>
      {/each}
    </div>
  {/if}
</div>
