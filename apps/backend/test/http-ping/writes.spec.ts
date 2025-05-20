import * as nock from 'nock';
import { HttpPingSchedulerService } from '../../src/http-ping/schedule/http-ping-scheduler.service';
import { createTestApp } from '../utils/bootstrap';
import { URL_STUB } from '../utils/http-monitor-utils';

describe('Http Ping (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let schedulerService: HttpPingSchedulerService;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    schedulerService = bootstrap.app.get(HttpPingSchedulerService);
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
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
    const monitorA = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupA.token,
      clusterId: setupA.cluster.id,
    });
    const monitorB = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token: setupB.token,
      clusterId: setupB.cluster.id,
    });

    // when
    await schedulerService.tryPingAllMonitors();
    await schedulerService.tryPingAllMonitors();

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
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();
    for (let i = 0; i < 1000; i++) {
      await bootstrap.utils.httpMonitorsUtils.storeHttpMonitor({
        token: setup.token,
        clusterId: setup.cluster.id,
      });
    }

    // when
    await schedulerService.tryPingAllMonitors();

    // then
    const allPings = await bootstrap.utils.httpPingUtils.getAllPings();
    expect(allPings.length).toBe(1000);
  }, 15000);

  it('stores pings with failed status code', async () => {
    // given
    const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
    const anotherUrl = 'https://another-url.com';
    const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      token,
      clusterId: cluster.id,
      url: anotherUrl,
    });
    nock(anotherUrl).persist().get('/').delay(10).reply(403);

    // when
    await schedulerService.tryPingAllMonitors();

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
});
