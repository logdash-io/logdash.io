<script lang="ts">
  import { PingChart } from '@logdash/hyper-ui/features';
  import MonitoringHeader from '../tiles/monitoring/MonitoringHeader.svelte';

  const fakePings = Array.from({ length: 40 }, (_, i) => ({
    createdAt: new Date(Date.now() - i * 15000).toISOString(),
    statusCode: 200,
    responseTimeMs: Math.floor(Math.random() * 100) + 50,
  }));
</script>

<div class="flex w-full flex-col p-6">
  <MonitoringHeader name="api.example.com" status="up" />

  <div class="z-10 mt-2 w-full">
    <PingChart maxPingsToShow={40} pings={fakePings} />
  </div>
</div>
