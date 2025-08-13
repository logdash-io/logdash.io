import * as nock from 'nock';
import { firstValueFrom, take, toArray } from 'rxjs';
import { HttpPingCoreController } from '../../src/http-ping/core/http-ping-core.controller';
import { createTestApp } from '../utils/bootstrap';
import { URL_STUB } from '../utils/http-monitor-utils';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { HttpPingPingerService } from '../../src/http-ping/pinger/http-ping-pinger.service';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';

describe('Http Ping (SSE)', () => {
  let controller: HttpPingCoreController;
  let pingerService: HttpPingPingerService;
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    controller = bootstrap.app.get(HttpPingCoreController);
    pingerService = bootstrap.app.get(HttpPingPingerService);
    nock(URL_STUB).persist().get('/').delay(10).reply(200);
  });

  beforeEach(async () => {
    await bootstrap.methods.clearDatabase();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('GET /clusters/:clusterId/http_pings/sse', () => {
    it('receives ping events for the specified cluster', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitorA = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupA.token,
        projectId: setupA.project.id,
      });

      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitorB = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupB.token,
        projectId: setupB.project.id,
      });

      // when
      const stream = await controller.streamHttpMonitorPings(setupA.cluster.id);
      const resultsPromise = firstValueFrom(stream.pipe(take(1)));

      await pingerService.tryPingMonitors([ProjectTier.Free]);

      // then
      const results = await resultsPromise;

      expect(results.data).toMatchObject({
        httpMonitorId: monitorA.id,
        clusterId: setupA.cluster.id,
        statusCode: 200,
        responseTimeMs: expect.any(Number),
        message: undefined,
      });
    });

    it('processes multiple ping events in sequence', async () => {
      // given
      nock.cleanAll();
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitorA = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupA.token,
        projectId: setupA.project.id,
      });

      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const monitorB = await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
        token: setupB.token,
        projectId: setupB.project.id,
      });

      // when
      const stream = await controller.streamHttpMonitorPings(setupA.cluster.id);
      const resultsPromise = firstValueFrom(stream.pipe(take(2), toArray()));
      nock(URL_STUB).get('/').times(2).delay(10).reply(200);
      await pingerService.tryPingMonitors([ProjectTier.Free]);
      nock(URL_STUB).get('/').times(2).delay(10).reply(404);
      await pingerService.tryPingMonitors([ProjectTier.Free]);

      // then
      const results = await resultsPromise;

      expect(results).toHaveLength(2);
      expect(results[0].data).toMatchObject({
        httpMonitorId: monitorA.id,
        statusCode: 200,
        responseTimeMs: expect.any(Number),
        message: undefined,
      });
      expect(results[1].data).toMatchObject({
        httpMonitorId: monitorA.id,
        statusCode: 404,
        responseTimeMs: expect.any(Number),
        message: 'Not Found',
      });
    });
  });
});
