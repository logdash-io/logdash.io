import { advanceBy } from 'jest-date-mock';
import * as nock from 'nock';
import { HttpPingBucketIngestionService } from '../../src/http-ping-bucket/ingestion/http-ping-bucket-ingestion.service';
import { createTestApp } from '../utils/bootstrap';
import { URL_STUB } from '../utils/http-monitor-utils';

describe('Http Ping (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    nock(URL_STUB).persist().get('/').delay(10).reply(200, 'ok');
  });

  beforeEach(async () => {
    await bootstrap.methods.clearDatabase();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('CRON bucket ingestion', () => {
    it('creates buckets from pings for previous hour', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
      });
      const twoHoursMs = 2 * 60 * 60 * 1000;
      const oneHourMs = 1 * 60 * 60 * 1000;

      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: monitor.id,
        statusCode: 200,
        responseTimeMs: 100,
      });
      advanceBy(twoHoursMs);

      // when
      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: monitor.id,
        statusCode: 200,
        responseTimeMs: 150,
      });
      await bootstrap.utils.httpPingUtils.createHttpPing({
        httpMonitorId: monitor.id,
        statusCode: 500,
        responseTimeMs: 300,
      });

      // then
      advanceBy(oneHourMs);
      const scheduler = bootstrap.app.get(HttpPingBucketIngestionService);
      await scheduler.createBucketsForPreviousHour();

      const buckets = await bootstrap.utils.httpPingBucketUtils.getMonitorBuckets({
        httpMonitorId: monitor.id,
      });

      expect(buckets).toHaveLength(1);
      expect(buckets[0]).toMatchObject({
        httpMonitorId: monitor.id,
        successCount: 1,
        failureCount: 1,
        averageLatencyMs: 225,
      });
    });

    it('does not create buckets when no pings exist', async () => {
      // when
      const scheduler = bootstrap.app.get(HttpPingBucketIngestionService);
      await scheduler.createBucketsForPreviousHour();

      // then
      const buckets = await bootstrap.utils.httpPingBucketUtils.getAllBuckets();
      expect(buckets).toHaveLength(0);
    });
  });
});
