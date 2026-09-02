<script lang="ts">
  const BARS_COUNT = 45;

  const SERVICES = [
    { name: 'API', unhealthyIndex: 13 },
    { name: 'Database', unhealthyIndex: -1 },
    { name: 'Cache', unhealthyIndex: 2 },
    { name: 'Queue', unhealthyIndex: 5 },
  ];
</script>

<div class="flex w-full flex-col gap-3">
  {#each SERVICES as service (service.name)}
    <div class="flex w-full flex-col gap-1">
      <span class="text-base-content/70 text-sm">{service.name}</span>

      <div class="flex h-4 w-full items-center gap-1 overflow-hidden">
        {#each new Array(BARS_COUNT), i (i)}
          <div
            class={[
              'h-full min-w-0 flex-1 rounded-xs',
              {
                'bg-success': service.unhealthyIndex !== i,
                'bg-warning': service.unhealthyIndex === i,
              },
            ]}
          ></div>
        {/each}
      </div>
    </div>
  {/each}
</div>
