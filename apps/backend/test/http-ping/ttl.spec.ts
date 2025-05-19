import { advanceBy } from 'jest-date-mock';
import { HttpPingTtlService } from '../../src/http-ping/ttl/http-ping-ttl.service';
import { createTestApp } from '../utils/bootstrap';

describe('Http Ping (ttl)', () => {
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

  describe('CRON deletes pings', () => {
    it('older than 1 hour', async () => {
      // given
      const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: token,
        clusterId: cluster.id,
      });
      await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });
      advanceBy(60 * 60 * 1_000);
      await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });
      advanceBy(59 * 60 * 1_000);

      // when
      await bootstrap.app.get(HttpPingTtlService).deleteOldPings();

      // then
      const pings = await bootstrap.utils.httpPingUtils.getMonitorPings({
        httpMonitorId: monitor.id,
      });
      expect(pings.length).toBe(1);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      expect(pings[0].createdAt.getTime()).toBeGreaterThan(oneHourAgo);
    });
  });
});
