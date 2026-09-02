import { advanceBy } from 'jest-date-mock';
import { HttpMonitorTtlService } from '../../src/http-monitor/ttl/http-monitor-ttl.service';
import { createTestApp } from '../utils/bootstrap';

describe('Http Monitor (ttl)', () => {
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

  describe('CRON deletes unclaimed monitors', () => {
    it('older than 10 minutes', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const oldUnclaimedMonitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        projectId: project.id,
        name: 'Old unclaimed monitor',
        url: 'https://example-old.com',
      });

      advanceBy(11 * 60 * 1000);

      const recentUnclaimedMonitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        projectId: project.id,
        name: 'Recent unclaimed monitor',
        url: 'https://example-recent.com',
      });

      const claimedMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: token,
        projectId: project.id,
        name: 'Claimed monitor',
        url: 'https://example-claimed.com',
      });

      // when
      await bootstrap.app.get(HttpMonitorTtlService).deleteOldUnclaimedMonitors();

      // then
      const allMonitors = await bootstrap.models.httpMonitorModel.find().lean();
      expect(allMonitors).toHaveLength(2);

      const monitorIds = allMonitors.map((m) => m._id.toString());
      expect(monitorIds).toContain(recentUnclaimedMonitor.id);
      expect(monitorIds).toContain(claimedMonitor.id);
      expect(monitorIds).not.toContain(oldUnclaimedMonitor.id);

      // Verify the remaining unclaimed monitor is the recent one
      const remainingUnclaimedMonitor = allMonitors.find((m) => !m.claimed);
      expect(remainingUnclaimedMonitor?._id.toString()).toBe(recentUnclaimedMonitor.id);

      // Verify the claimed monitor is still there
      const remainingClaimedMonitor = allMonitors.find((m) => m.claimed);
      expect(remainingClaimedMonitor?._id.toString()).toBe(claimedMonitor.id);
    });

    it('does not delete claimed monitors regardless of age', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      const claimedMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: token,
        projectId: project.id,
        name: 'Old claimed monitor',
        url: 'https://example-claimed.com',
      });

      // Advance time by 11 minutes to make it older than the 10-minute cutoff
      advanceBy(11 * 60 * 1000);

      // when
      await bootstrap.app.get(HttpMonitorTtlService).deleteOldUnclaimedMonitors();

      // then
      const allMonitors = await bootstrap.models.httpMonitorModel.find().lean();
      expect(allMonitors).toHaveLength(1);
      expect(allMonitors[0]._id.toString()).toBe(claimedMonitor.id);
      expect(allMonitors[0].claimed).toBe(true);
    });

    it('does not delete recent unclaimed monitors', async () => {
      // given
      const { project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // Create a recent unclaimed monitor (within 10 minutes)
      const recentUnclaimedMonitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        projectId: project.id,
        name: 'Recent unclaimed monitor',
        url: 'https://example-recent.com',
      });

      advanceBy(5 * 60 * 1000);

      // when
      await bootstrap.app.get(HttpMonitorTtlService).deleteOldUnclaimedMonitors();

      // then
      const allMonitors = await bootstrap.models.httpMonitorModel.find().lean();
      expect(allMonitors).toHaveLength(1);
      expect(allMonitors[0]._id.toString()).toBe(recentUnclaimedMonitor.id);
      expect(allMonitors[0].claimed).toBe(false);
    });
  });
});
