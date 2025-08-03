import * as nock from 'nock';
import { createTestApp } from '../utils/bootstrap';
import { URL_STUB } from '../utils/http-monitor-utils';
import { HttpPingPingerService } from '../../src/http-ping/pinger/http-ping-pinger.service';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

describe('Http Ping (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let schedulerService: HttpPingPingerService;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    schedulerService = bootstrap.app.get(HttpPingPingerService);
    nock(URL_STUB).persist().get('/').delay(10).reply(200, 'ok');
  });

  beforeEach(async () => {
    await bootstrap.methods.clearDatabase();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('stores pings for multiple monitors', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const monitorA = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setupA.token,
      projectId: setupA.project.id,
    });
    const monitorB = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setupB.token,
      projectId: setupB.project.id,
    });

    // when
    await schedulerService.tryPingMonitors([ProjectTier.EarlyBird]);
    await schedulerService.tryPingMonitors([ProjectTier.EarlyBird]);

    // then
    const pingsA = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitorA.id,
    });
    const pingsB = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitorB.id,
    });
    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(pingsA.length).toBe(2);
    expect(pingsB.length).toBe(2);
    expect(allPings.length).toBe(4);
  });

  it('handles pings for a large number of monitors', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    for (let i = 0; i < 1000; i++) {
      await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        token: setup.token,
        projectId: setup.project.id,
        claimed: true,
      });
    }

    // when
    await schedulerService.tryPingMonitors([ProjectTier.EarlyBird]);

    // then
    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(allPings.length).toBe(1000);
  }, 30000);

  it('handles pings for large number of projects and monitors', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });

    const projects = await Promise.all(
      Array.from({ length: 1000 }, () =>
        bootstrap.utils.projectUtils.createDefaultProject({
          userId: setup.user.id,
          tier: ProjectTier.EarlyBird,
        }),
      ),
    );

    await Promise.all(
      projects.map((project) =>
        bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
          projectId: project.id,
          claimed: true,
        }),
      ),
    );

    // when
    await schedulerService.tryPingMonitors([ProjectTier.EarlyBird]);

    // then
    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(allPings.length).toBe(1000);
  }, 30000);

  it('stores pings with failed status code', async () => {
    // given
    const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const anotherUrl = 'https://another-url.com';
    const monitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token,
      projectId: project.id,
      url: anotherUrl,
    });
    nock(anotherUrl).persist().get('/').delay(10).reply(403);

    // when
    await schedulerService.tryPingMonitors([ProjectTier.EarlyBird]);

    // then
    const pings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitor.id,
    });
    expect(pings.length).toBe(1);
    expect(pings[0]).toMatchObject({
      statusCode: 403,
      responseTimeMs: expect.any(Number),
      message: 'Forbidden',
    });
  });

  it('does not ping monitors for users with other tier', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.Free,
    });
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });
    const monitorA = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setupA.token,
      projectId: setupA.project.id,
    });
    const monitorB = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token: setupB.token,
      projectId: setupB.project.id,
    });

    // when
    await schedulerService.tryPingMonitors([ProjectTier.Free]);

    // then
    const pingsA = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitorA.id,
    });
    const pingsB = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: monitorB.id,
    });
    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(pingsA.length).toBe(1);
    expect(pingsB.length).toBe(0);
    expect(allPings.length).toBe(1);
  });

  it('does not ping unclaimed monitors', async () => {
    // given
    const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous({
      userTier: UserTier.EarlyBird,
    });

    const claimedMonitor = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      token,
      projectId: project.id,
    });

    const unclaimedMonitor = await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
      projectId: project.id,
      name: 'Unclaimed Monitor',
      url: URL_STUB,
    });

    // when
    await schedulerService.tryPingMonitors([ProjectTier.EarlyBird]);

    // then
    const claimedMonitorPings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: claimedMonitor.id,
    });
    const unclaimedMonitorPings = await bootstrap.utils.httpPingUtils.getMonitorPings({
      httpMonitorId: unclaimedMonitor.id,
    });
    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();

    expect(claimedMonitorPings.length).toBe(1);
    expect(unclaimedMonitorPings.length).toBe(0);
    expect(allPings.length).toBe(1);

    // Verify the ping was created for the claimed monitor only
    expect(allPings[0].httpMonitorId).toBe(claimedMonitor.id);
  });
});
