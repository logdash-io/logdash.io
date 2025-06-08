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
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: token,
        projectId: project.id,
      });
      await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });
      advanceBy(12 * 60 * 60 * 1_000);
      await bootstrap.utils.httpPingUtils.createHttpPing({ httpMonitorId: monitor.id });
      advanceBy(11 * 60 * 60 * 1_000);

      // when
      await bootstrap.app.get(HttpPingTtlService).deleteOldPings();

      // then
      const pings = await bootstrap.utils.httpPingUtils.getMonitorPings({
        httpMonitorId: monitor.id,
      });
      expect(pings.length).toBe(1);
      const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
      expect(pings[0].createdAt.getTime()).toBeGreaterThan(twelveHoursAgo);
    });
  });
});
