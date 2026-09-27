<script lang="ts">
  type Incident = 'degraded' | 'down';

  const DAYS = 90;

  const SERVICES: {
    name: string;
    uptime: string;
    incidents: Record<number, Incident>;
  }[] = [
    {
      name: 'API',
      uptime: '99.98%',
      incidents: { 23: 'down', 71: 'degraded' },
    },
    {
      name: 'Email queue',
      uptime: '99.71%',
      incidents: { 12: 'degraded', 13: 'down', 58: 'degraded' },
    },
    { name: 'Dashboard', uptime: '100%', incidents: {} },
  ];
</script>

<div class="flex h-full w-full flex-col gap-5 sm:gap-6">
  <div class="flex flex-col gap-0.5">
    <span class="text-neutral-500 text-xs">Acme status</span>
    <span class="flex items-center gap-2.5 text-2xl font-medium">
      <span class="bg-success size-2 shrink-0 rounded-full"></span>
      All systems operational
    </span>
  </div>

  <div class="flex flex-1 flex-col justify-end gap-5">
    {#each SERVICES as service, index (service.name)}
      <div
        class={[
          'flex flex-col gap-2',
          { 'max-sm:hidden': index > 0, 'max-lg:hidden': index > 1 },
        ]}
      >
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-neutral-300">{service.name}</span>
          <span class="text-neutral-500 tabular-nums">{service.uptime}</span>
        </div>

        <div class="flex h-7 gap-px sm:gap-0.5" aria-hidden="true">
          {#each Array.from({ length: DAYS }), day (day)}
            <span
              class={[
                'min-w-0 flex-1 rounded-[1px]',
                {
                  'bg-neutral-700': !service.incidents[day],
                  'bg-warning': service.incidents[day] === 'degraded',
                  'bg-error': service.incidents[day] === 'down',
                },
              ]}
            ></span>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div
    class="text-neutral-600 flex items-center justify-between font-mono text-xs"
  >
    <span>90 days ago</span>
    <span>Today</span>
  </div>
</div>
