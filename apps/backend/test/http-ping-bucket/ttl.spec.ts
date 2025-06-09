import { HttpPingBucketTtlService } from '../../src/http-ping-bucket/ttl/http-ping-bucket-ttl.service';
import { createTestApp } from '../utils/bootstrap';

describe('Http Ping Bucket (ttl)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.clearDatabase();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('CRON deletes buckets', () => {
    it('older than 90 days', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: token,
        projectId: project.id,
      });

      const now = new Date();
      const ninetyOneDaysAgo = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000);
      const eightNineDaysAgo = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);

      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: monitor.id,
        timestamp: ninetyOneDaysAgo,
      });
      await bootstrap.utils.httpPingBucketUtils.createHttpPingBucket({
        httpMonitorId: monitor.id,
        timestamp: eightNineDaysAgo,
      });

      // when
      await bootstrap.app.get(HttpPingBucketTtlService).deleteOldBuckets();

      // then
      const buckets = await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({
        httpMonitorId: monitor.id,
      });
      expect(buckets.length).toBe(1);
      expect(buckets[0].timestamp.getTime()).toBeCloseTo(eightNineDaysAgo.getTime(), -10000);
    });
  });
});
