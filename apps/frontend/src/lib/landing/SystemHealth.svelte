<script lang="ts">
  const SERVICES = [
    {
      name: 'API',
      status: 'up',
      uptime: '100%',
      responseTime: '100ms',
      randomUnhealthyIndex: 13,
    },
    {
      name: 'Database',
      status: 'up',
      uptime: '100%',
      responseTime: '100ms',
      randomUnhealthyIndex: -1,
    },
    {
      name: 'Cache',
      status: 'up',
      uptime: '100%',
      responseTime: '100ms',
      randomUnhealthyIndex: 2,
    },
    {
      name: 'Queue',
      status: 'up',
      uptime: '100%',
      responseTime: '100ms',
      randomUnhealthyIndex: 5,
    },
  ];

  const isMobile = $derived.by(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
</script>

<div
  class="ld-card-base flex max-w-md flex-col gap-4 overflow-hidden rounded-xl p-6 lg:p-8 lg:pt-6"
>
  <h5 class="text-center text-lg">All Systems Operational</h5>

  {#each SERVICES as service}
    <div class="flex w-full flex-col gap-1">
      <span>{service.name}</span>

      <div
        class="flex h-6 w-full items-center justify-start gap-1 overflow-hidden lg:gap-1"
      >
        {#each new Array(isMobile ? 30 : 50) as _, i}
          <div
            class={[
              'h-full w-1.5 shrink-0 rounded-xs lg:w-1.5',
              {
                'bg-success':
                  service.randomUnhealthyIndex === -1 ||
                  service.randomUnhealthyIndex !== i,
                'bg-warning': service.randomUnhealthyIndex === i,
              },
            ]}
          ></div>
        {/each}
      </div>
    </div>
  {/each}
</div>
