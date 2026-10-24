import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ClusterIngestKeySerialized } from '../../src/api-key/core/entities/api-key.interface';
import { CreateLogsBatchBody } from '../../src/log/core/dto/create-logs-batch.body';
import { ClusterLogSerialized } from '../../src/log/core/entities/log.interface';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { LogQueueingService } from '../../src/log/queueing/log-queueing.service';
import { LogAnalyticsResponse } from '../../src/log/analytics/dto/log-analytics-response.dto';
import { NamespaceMetadata } from '../../src/log/read/dto/namespace-metadata.dto';
import { ClusterSerialized } from '../../src/cluster/core/entities/cluster.interface';

describe('Domain logs (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  async function sendLogs(
    clusterId: string,
    token: string,
    batch: CreateLogsBatchBody,
  ): Promise<void> {
    const keyResponse = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${clusterId}/ingest-key`)
      .set('Authorization', `Bearer ${token}`);

    await request(bootstrap.app.getHttpServer())
      .post('/logs/batch')
      .set('project-api-key', (keyResponse.body as ClusterIngestKeySerialized).value)
      .send(batch)
      .expect(201);

    await bootstrap.app.get(LogQueueingService).processQueue();
  }

  function at(secondsAgo: number): string {
    return new Date(Date.now() - secondsAgo * 1000).toISOString();
  }

  describe('GET /clusters/:clusterId/logs', () => {
    it('reads the logs of every app on the domain, newest first, with their app', async () => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      await sendLogs(cluster.id, token, {
        logs: [
          { createdAt: at(3), message: 'oldest', level: LogLevel.Info, app: 'api' },
          { createdAt: at(2), message: 'middle', level: LogLevel.Error, app: 'web' },
          { createdAt: at(1), message: 'newest', level: LogLevel.Info, app: 'api' },
        ],
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/logs`)
        .set('Authorization', `Bearer ${token}`);

      // then
      const logs = response.body as ClusterLogSerialized[];

      expect(response.status).toEqual(200);
      expect(logs.map(({ message, app }) => [message, app])).toEqual([
        ['newest', 'api'],
        ['middle', 'web'],
        ['oldest', 'api'],
      ]);
    });

    it('reads only the apps asked for', async () => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      await sendLogs(cluster.id, token, {
        logs: [
          { createdAt: at(2), message: 'from api', level: LogLevel.Info, app: 'api' },
          { createdAt: at(1), message: 'from web', level: LogLevel.Info, app: 'web' },
        ],
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/logs?apps=web`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect((response.body as ClusterLogSerialized[]).map(({ message }) => message)).toEqual([
        'from web',
      ]);
    });

    it('pages through logs that share a time and a sequence number without skipping any', async () => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const createdAt = at(1);

      await sendLogs(cluster.id, token, {
        logs: ['api', 'web', 'api', 'web', 'api'].map((app, index) => ({
          createdAt,
          message: `log ${index}`,
          level: LogLevel.Info,
          sequenceNumber: 0,
          app,
        })),
      });

      // when
      const seen: string[] = [];
      let lastId: string | undefined;

      for (let page = 0; page < 5; page++) {
        const query = lastId ? `limit=2&lastId=${lastId}&direction=before` : 'limit=2';
        const response = await request(bootstrap.app.getHttpServer())
          .get(`/clusters/${cluster.id}/logs?${query}`)
          .set('Authorization', `Bearer ${token}`);
        const logs = response.body as ClusterLogSerialized[];

        if (logs.length === 0) {
          break;
        }

        seen.push(...logs.map(({ message }) => message));
        lastId = logs[logs.length - 1].id;
      }

      // then
      expect(seen.sort()).toEqual(['log 0', 'log 1', 'log 2', 'log 3', 'log 4']);
    });

    it('does not let a user from another domain read its logs', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupA.cluster.id}/logs`)
        .set('Authorization', `Bearer ${setupB.token}`);

      // then
      expect(response.status).toEqual(403);
    });
  });

  describe('GET /clusters/:clusterId/logs/namespaces', () => {
    it('lists the namespaces of the apps asked for', async () => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      await sendLogs(cluster.id, token, {
        logs: [
          { createdAt: at(2), message: 'a', level: LogLevel.Info, namespace: 'auth', app: 'api' },
          {
            createdAt: at(1),
            message: 'b',
            level: LogLevel.Info,
            namespace: 'sidebar',
            app: 'web',
          },
        ],
      });

      // when
      const [all, web] = await Promise.all(
        ['', '?apps=web'].map((query) =>
          request(bootstrap.app.getHttpServer())
            .get(`/clusters/${cluster.id}/logs/namespaces${query}`)
            .set('Authorization', `Bearer ${token}`),
        ),
      );

      // then
      const names = (response: request.Response): string[] =>
        (response.body as NamespaceMetadata[]).map(({ namespace }) => namespace).sort();

      expect(names(all)).toEqual(['auth', 'sidebar']);
      expect(names(web)).toEqual(['sidebar']);
    });
  });

  describe('GET /clusters/:clusterId/logs/analytics', () => {
    it('counts the logs of the apps asked for', async () => {
      // given
      const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

      await sendLogs(cluster.id, token, {
        logs: [
          { createdAt: at(120), message: 'a', level: LogLevel.Error, app: 'api' },
          { createdAt: at(90), message: 'b', level: LogLevel.Info, app: 'web' },
          { createdAt: at(60), message: 'c', level: LogLevel.Error, app: 'web' },
        ],
      });

      const range = `startDate=${at(3600)}&endDate=${new Date().toISOString()}`;

      // when
      const [all, web, none] = await Promise.all(
        ['', '&apps=web', '&apps=missing'].map((query) =>
          request(bootstrap.app.getHttpServer())
            .get(`/clusters/${cluster.id}/logs/analytics?${range}${query}`)
            .set('Authorization', `Bearer ${token}`),
        ),
      );

      // then
      expect((all.body as LogAnalyticsResponse).totalLogs).toEqual(3);
      expect((web.body as LogAnalyticsResponse).totalLogs).toEqual(2);
      expect(none.status).toEqual(200);
      expect((none.body as LogAnalyticsResponse).totalLogs).toEqual(0);
    });

    it('spans the asked range on a domain that has no app yet', async () => {
      // given
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();
      const clusterResponse = await request(bootstrap.app.getHttpServer())
        .post('/users/me/clusters')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'empty.dev' });
      const { id } = clusterResponse.body as ClusterSerialized;

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(
          `/clusters/${id}/logs/analytics?startDate=${at(3600)}&endDate=${new Date().toISOString()}`,
        )
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.status).toEqual(200);
      expect((response.body as LogAnalyticsResponse).buckets.length).toBeGreaterThan(1);
    });
  });
});
