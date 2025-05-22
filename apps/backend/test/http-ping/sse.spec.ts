import * as nock from 'nock';
import { firstValueFrom, take, toArray } from 'rxjs';
import { HttpPingCoreController } from '../../src/http-ping/core/http-ping-core.controller';
import { HttpPingSchedulerService } from '../../src/http-ping/schedule/http-ping-scheduler.service';
import { createTestApp } from '../utils/bootstrap';
import { URL_STUB } from '../utils/http-monitor-utils';

describe('Http Ping (SSE)', () => {
  let controller: HttpPingCoreController;
  let schedulerService: HttpPingSchedulerService;
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    controller = bootstrap.app.get(HttpPingCoreController);
    schedulerService = bootstrap.app.get(HttpPingSchedulerService);
    nock(URL_STUB).persist().get('/').delay(10).reply(200);
  });

  beforeEach(async () => {
    await bootstrap.methods.clearDatabase();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('GET /clusters/:clusterId/monitors/:monitorId/http_pings/sse', () => {
    it('receives ping events for the specified monitor', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: setup.token,
        clusterId: setup.cluster.id,
      });

      // when
      const stream = await controller.streamHttpMonitorPings(setup.cluster.id, monitor.id);
      const resultsPromise = firstValueFrom(stream.pipe(take(1)));

      await schedulerService.tryPingAllMonitors();

      // then
      const results = await resultsPromise;
      expect(results.data).toMatchObject({
        httpMonitorId: monitor.id,
        statusCode: 200,
        responseTimeMs: expect.any(Number),
        message: 'OK',
      });
    });

    it('filters out events from other monitors', async () => {
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
      const stream = await controller.streamHttpMonitorPings(setupB.cluster.id, monitorB.id);
      const resultPromise = Promise.race([
        firstValueFrom(stream.pipe(take(1))),
        new Promise((resolve) => setTimeout(() => resolve(null), 1000)),
      ]);
      await schedulerService.tryPingAllMonitors();

      // then
      const result = await resultPromise;
      expect(result.data).toMatchObject({
        httpMonitorId: monitorB.id,
        statusCode: 200,
        responseTimeMs: expect.any(Number),
        message: 'OK',
      });
    });

    it('processes multiple ping events in sequence', async () => {
      // given
      nock.cleanAll();
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitor = await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: setup.token,
        clusterId: setup.cluster.id,
      });

      // when
      const stream = await controller.streamHttpMonitorPings(setup.cluster.id, monitor.id);
      const resultsPromise = firstValueFrom(stream.pipe(take(2), toArray()));
      nock(URL_STUB).get('/').delay(10).reply(200);
      await schedulerService.tryPingAllMonitors();
      nock(URL_STUB).get('/').delay(10).reply(404);
      await schedulerService.tryPingAllMonitors();

      // then
      const results = await resultsPromise;
      expect(results).toHaveLength(2);
      expect(results[0].data).toMatchObject({
        httpMonitorId: monitor.id,
        statusCode: 200,
        responseTimeMs: expect.any(Number),
        message: 'OK',
      });
      expect(results[1].data).toMatchObject({
        httpMonitorId: monitor.id,
        statusCode: 404,
        responseTimeMs: expect.any(Number),
        message: 'Not Found',
      });
    });
  });
});
