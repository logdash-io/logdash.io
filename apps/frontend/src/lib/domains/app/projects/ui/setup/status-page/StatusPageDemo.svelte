<script lang="ts">
  import {
    PublicDashboard as PublicDashboardComponent,
    PublicDashboardState,
    type PublicDashboardData,
  } from '@logdash/hyper-ui/features';

  class DemoStatusPageState extends PublicDashboardState {
    constructor() {
      super();
      this.setDashboardData(generateDemoData());
    }

    public async loadDashboard(): Promise<void> {}
  }

  const demoState = new DemoStatusPageState();

  function generateDemoData(): PublicDashboardData {
    const now = new Date();

    const apiDowntime = new Set([12, 13, 14, 28, 45, 46]);
    const apiDegraded = new Set([11, 15, 27, 29, 44, 47]);

    const paymentDowntime = new Set([5, 6, 33, 34, 35]);
    const paymentDegraded = new Set([4, 7, 32, 36, 52]);

    const emailDowntime = new Set<number>([]);
    const emailDegraded = new Set([18, 19, 41, 55]);

    function createPings(
      downtime: Set<number>,
      degraded: Set<number>,
      baseLatency: number,
    ): Array<{
      createdAt: string;
      statusCode: number;
      responseTimeMs: number;
    }> {
      return Array.from({ length: 90 }, (_, i) => {
        const isDown = downtime.has(i);
        const isDegraded = degraded.has(i);
        return {
          createdAt: new Date(now.getTime() - i * 15 * 1000).toISOString(),
          statusCode: isDown ? 500 : isDegraded ? 503 : 200,
          responseTimeMs: isDown
            ? 0
            : isDegraded
              ? 2200 + (i % 5) * 100
              : baseLatency + (i % 7) * 12,
        };
      });
    }

    function createBuckets(
      downtime: Set<number>,
      degraded: Set<number>,
      baseLatency: number,
    ): Array<{
      timestamp: string;
      successCount: number;
      failureCount: number;
      averageLatencyMs: number;
    }> {
      return Array.from({ length: 60 }, (_, i) => {
        const isDown = downtime.has(i);
        const isDegraded = degraded.has(i);
        const total = 96;
        const successCount = isDown ? 0 : isDegraded ? 72 : 96;
        return {
          timestamp: new Date(
            now.getTime() - i * 24 * 60 * 60 * 1000,
          ).toISOString(),
          successCount,
          failureCount: total - successCount,
          averageLatencyMs: isDown
            ? 0
            : isDegraded
              ? 1600 + (i % 4) * 150
              : baseLatency + (i % 5) * 8,
        };
      });
    }

    return {
      name: 'Status Page',
      httpMonitors: [
        {
          name: 'api',
          pings: createPings(apiDowntime, apiDegraded, 85),
          buckets: createBuckets(apiDowntime, apiDegraded, 92),
        },
        {
          name: 'email queue',
          pings: createPings(paymentDowntime, paymentDegraded, 120),
          buckets: createBuckets(paymentDowntime, paymentDegraded, 145),
        },
      ],
    };
  }
</script>

<div class="w-full">
  <PublicDashboardComponent
    state={demoState}
    enablePolling={false}
    maxBucketsToShow={90}
    maxPingsToShow={60}
    withBranding={false}
    withHeader={true}
    expanded={false}
  />
</div>
