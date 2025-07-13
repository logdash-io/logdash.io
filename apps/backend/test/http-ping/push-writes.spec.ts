import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { createTestApp } from '../utils/bootstrap';
import { HttpPingPushService } from '../../src/http-ping/push/http-ping-push.service';
import { HttpMonitorMode } from '../../src/http-monitor/core/enums/http-monitor-mode.enum';
import { RedisService } from '../../src/shared/redis/redis.service';
import { HttpMonitorNormalized } from '../../src/http-monitor/core/entities/http-monitor.interface';

describe('Http Ping Push (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let pushService: HttpPingPushService;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    pushService = bootstrap.app.get(HttpPingPushService);
  });

  beforeEach(async () => {
    await bootstrap.methods.clearDatabase();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('creates successful ping when push record exists', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Push,
    });

    await pushService.record(monitor.id);
    await pushService.checkPushMonitors();

    const pings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitor.id,
    });
    expect(pings.length).toBe(1);
    expect(pings[0]).toMatchObject({
      statusCode: 200,
      responseTimeMs: 0,
      message: undefined,
    });
  });

  it('creates failed ping when no push record exists', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Push,
    });

    await pushService.checkPushMonitors();

    const pings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitor.id,
    });
    expect(pings.length).toBe(1);
    expect(pings[0]).toMatchObject({
      statusCode: 0,
      responseTimeMs: 0,
      message: 'Did not receive call for this time range',
    });
  });

  it('processes multiple push monitors correctly', async () => {
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const monitorA = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupA.token,
      projectId: setupA.project.id,
      mode: HttpMonitorMode.Push,
    });
    const monitorB = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupB.token,
      projectId: setupB.project.id,
      mode: HttpMonitorMode.Push,
    });

    await pushService.record(monitorA.id);
    await pushService.checkPushMonitors();

    const pingsA = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitorA.id,
    });
    const pingsB = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitorB.id,
    });
    expect(pingsA.length).toBe(1);
    expect(pingsA[0].statusCode).toBe(200);
    expect(pingsB.length).toBe(1);
    expect(pingsB[0].statusCode).toBe(0);
  });

  it('deletes push record after processing', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Push,
    });

    await pushService.record(monitor.id);
    await pushService.checkPushMonitors();

    const pings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitor.id,
    });
    expect(pings.length).toBe(1);
    expect(pings[0].statusCode).toBe(200);

    const redisService = bootstrap.app.get(RedisService);
    const key = `http-ping-push:${monitor.id}`;
    const record = await redisService.get(key);
    expect(record).toBeNull();
  });

  it('handles large number of push monitors', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const monitors: HttpMonitorNormalized[] = [];
    for (let i = 0; i < 100; i++) {
      const monitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        projectId: setup.project.id,
        mode: HttpMonitorMode.Push,
      });
      monitors.push(monitor);
    }

    for (let i = 0; i < 50; i++) {
      await pushService.record(monitors[i].id);
    }

    await pushService.checkPushMonitors();

    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(allPings.length).toBe(100);
    const successfulPings = allPings.filter((ping) => ping.statusCode === 200);
    const failedPings = allPings.filter((ping) => ping.statusCode === 0);
    expect(successfulPings.length).toBe(50);
    expect(failedPings.length).toBe(50);
  }, 30000);

  it('processes only push monitors, not pull monitors', async () => {
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const pushMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Push,
    });
    const pullMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Pull,
    });

    await pushService.record(pushMonitor.id);
    await pushService.checkPushMonitors();

    const pushPings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: pushMonitor.id,
    });
    const pullPings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: pullMonitor.id,
    });
    expect(pushPings.length).toBe(1);
    expect(pullPings.length).toBe(0);
  });

  it('respects user tiers when processing push monitors', async () => {
    const setupFree = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Free,
    });
    const setupPaid = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const freeMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupFree.token,
      projectId: setupFree.project.id,
      mode: HttpMonitorMode.Push,
    });
    const paidMonitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupPaid.token,
      projectId: setupPaid.project.id,
      mode: HttpMonitorMode.Push,
    });

    await pushService.record(freeMonitor.id);
    await pushService.record(paidMonitor.id);
    await pushService.checkPushMonitors();

    const freePings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: freeMonitor.id,
    });
    const paidPings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: paidMonitor.id,
    });

    expect(freePings.length).toBe(1);
    expect(paidPings.length).toBe(1);
  });

  it('handles empty push monitor list gracefully', async () => {
    await pushService.checkPushMonitors();

    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(allPings.length).toBe(0);
  });
});
