import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { createTestApp } from '../utils/bootstrap';
import { HttpPingPushService } from '../../src/http-ping/push/http-ping-push.service';
import { HttpMonitorMode } from '../../src/http-monitor/core/enums/http-monitor-mode.enum';
import { RedisService } from '../../src/shared/redis/redis.service';
import { HttpMonitorNormalized } from '../../src/http-monitor/core/entities/http-monitor.interface';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';
import * as request from 'supertest';

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
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Pro,
    });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Push,
    });

    // when
    await request(bootstrap.app.getHttpServer()).post(`/ping/${monitor.id}`);
    await pushService.checkPushMonitors(Object.values(ProjectTier));

    // then
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
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Pro,
    });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Push,
    });

    // when
    await pushService.checkPushMonitors(Object.values(ProjectTier));

    // then
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
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Pro,
    });
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Pro,
    });
    const monitorA = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setupA.token,
      projectId: setupA.project.id,
      mode: HttpMonitorMode.Push,
    });
    const monitorB = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setupB.token,
      projectId: setupB.project.id,
      mode: HttpMonitorMode.Push,
    });

    // when
    await request(bootstrap.app.getHttpServer()).post(`/ping/${monitorA.id}`);
    await pushService.checkPushMonitors(Object.values(ProjectTier));

    // then
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
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Pro,
    });
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Push,
    });

    // when
    await request(bootstrap.app.getHttpServer()).post(`/ping/${monitor.id}`);
    await pushService.checkPushMonitors(Object.values(ProjectTier));

    // then
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
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Pro,
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
      await request(bootstrap.app.getHttpServer()).post(`/ping/${monitors[i].id}`);
    }

    // when
    await pushService.checkPushMonitors(Object.values(ProjectTier));

    // then
    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(allPings.length).toBe(100);
    const successfulPings = allPings.filter((ping) => ping.statusCode === 200);
    const failedPings = allPings.filter((ping) => ping.statusCode === 0);
    expect(successfulPings.length).toBe(50);
    expect(failedPings.length).toBe(50);
  }, 30000);

  it('processes only push monitors, not pull monitors', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Pro,
    });
    const pushMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Push,
    });
    const pullMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setup.token,
      projectId: setup.project.id,
      mode: HttpMonitorMode.Pull,
    });

    // when
    await request(bootstrap.app.getHttpServer()).post(`/ping/${pushMonitor.id}`);
    await pushService.checkPushMonitors(Object.values(ProjectTier));

    // then
    const pushPings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: pushMonitor.id,
    });
    const pullPings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: pullMonitor.id,
    });
    expect(pushPings.length).toBe(1);
    expect(pullPings.length).toBe(0);
  });

  it('handles empty push monitor list gracefully', async () => {
    // when
    await pushService.checkPushMonitors(Object.values(ProjectTier));

    // then
    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(allPings.length).toBe(0);
  });
});
