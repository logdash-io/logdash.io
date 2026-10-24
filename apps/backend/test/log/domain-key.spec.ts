import { MessageEvent } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ClusterIngestKeySerialized } from '../../src/api-key/core/entities/api-key.interface';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { CreateLogsBatchBody } from '../../src/log/core/dto/create-logs-batch.body';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { LogCoreController } from '../../src/log/core/log-core.controller';
import { LogQueueingService } from '../../src/log/queueing/log-queueing.service';
import { ProjectSerialized } from '../../src/project/core/entities/project.interface';
import { CreateProjectResponse } from '../../src/project/core/dto/create-project.response';

describe('Logs sent with a domain key', () => {
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

  async function readDomainKey(clusterId: string, token: string): Promise<string> {
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${clusterId}/ingest-key`)
      .set('Authorization', `Bearer ${token}`);

    return (response.body as ClusterIngestKeySerialized).value;
  }

  async function readApps(clusterId: string, token: string): Promise<ProjectSerialized[]> {
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${clusterId}/projects`)
      .set('Authorization', `Bearer ${token}`);

    return response.body as ProjectSerialized[];
  }

  function log(message: string, app?: string): CreateLogBody {
    return { createdAt: new Date().toISOString(), message, level: LogLevel.Info, app };
  }

  it('creates an app on its first log and keeps its later logs together', async () => {
    // given
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await readDomainKey(cluster.id, token);

    // when
    for (const message of ['first', 'second']) {
      await request(bootstrap.app.getHttpServer())
        .post('/logs')
        .set('project-api-key', key)
        .send(log(message, 'desktop'))
        .expect(201);
    }

    await bootstrap.app.get(LogQueueingService).processQueue();

    // then
    const desktop = (await readApps(cluster.id, token)).filter(({ name }) => name === 'desktop');
    const logs = await bootstrap.utils.logUtils.readLogs(desktop[0].id);

    expect(desktop).toHaveLength(1);
    expect(logs.map(({ message }) => message).sort()).toEqual(['first', 'second']);
  });

  it('sends logs without an app to the default app', async () => {
    // given
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await readDomainKey(cluster.id, token);

    // when
    await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', key)
      .send(log('no app', '   '))
      .expect(201);

    // then
    const apps = await readApps(cluster.id, token);

    expect(apps.map(({ name }) => name)).toContain('default');
  });

  it('routes an app name to the service that already has it', async () => {
    // given
    const { cluster, project, token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await readDomainKey(cluster.id, token);

    // when
    await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', key)
      .send(log('into the old service', project.name))
      .expect(201);

    await bootstrap.app.get(LogQueueingService).processQueue();

    // then
    const logs = await bootstrap.utils.logUtils.readLogs(project.id);

    expect(await readApps(cluster.id, token)).toHaveLength(1);
    expect(logs.map(({ message }) => message)).toEqual(['into the old service']);
  });

  it('ignores the app of a log sent with a service key', async () => {
    // given
    const { apiKey, cluster, project, token } = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', apiKey.value)
      .send(log('service key', 'elsewhere'))
      .expect(201);

    await bootstrap.app.get(LogQueueingService).processQueue();

    // then
    expect((await readApps(cluster.id, token)).map(({ name }) => name)).toEqual([project.name]);
    expect(await bootstrap.utils.logUtils.readLogs(project.id)).toHaveLength(1);
  });

  it('creates one app when its first logs arrive at once', async () => {
    // given
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await readDomainKey(cluster.id, token);

    // when
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        request(bootstrap.app.getHttpServer())
          .post('/logs')
          .set('project-api-key', key)
          .send(log(`racing ${index}`, 'worker')),
      ),
    );

    // then
    const workers = (await readApps(cluster.id, token)).filter(({ name }) => name === 'worker');

    expect(responses.every(({ status }) => status === 201)).toBe(true);
    expect(workers).toHaveLength(1);
  });

  it('lands each log of a batch in its own app', async () => {
    // given
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await readDomainKey(cluster.id, token);
    const batch: CreateLogsBatchBody = {
      logs: [log('api one', 'api'), log('web one', 'web'), log('api two', 'api')],
    };

    // when
    await request(bootstrap.app.getHttpServer())
      .post('/logs/batch')
      .set('project-api-key', key)
      .send(batch)
      .expect(201);

    await bootstrap.app.get(LogQueueingService).processQueue();

    // then
    const apps = await readApps(cluster.id, token);
    const api = apps.find(({ name }) => name === 'api')!;
    const web = apps.find(({ name }) => name === 'web')!;

    expect(
      (await bootstrap.utils.logUtils.readLogs(api.id)).map(({ message }) => message).sort(),
    ).toEqual(['api one', 'api two']);
    expect((await bootstrap.utils.logUtils.readLogs(web.id)).map(({ message }) => message)).toEqual(
      ['web one'],
    );
  });

  it('rejects a new app once the plan has no app left', async () => {
    // given
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await readDomainKey(cluster.id, token);

    for (const name of ['one', 'two', 'three', 'four']) {
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/clusters/${cluster.id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name });

      expect((response.body as CreateProjectResponse).project.name).toEqual(name);
    }

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', key)
      .send(log('one too many', 'six'));

    // then
    expect(response.status).toEqual(409);
    expect(await readApps(cluster.id, token)).toHaveLength(5);
  });

  it('streams logs of every app to the domain stream with their app', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
    const key = await readDomainKey(setupA.cluster.id, setupA.token);
    const controller = bootstrap.app.get(LogCoreController);
    const receivedA: MessageEvent[] = [];
    const receivedB: MessageEvent[] = [];
    const subscriptionA = (await controller.streamClusterLogs({}, setupA.cluster.id)).subscribe(
      (message) => receivedA.push(message),
    );
    const subscriptionB = (await controller.streamClusterLogs({}, setupB.cluster.id)).subscribe(
      (message) => receivedB.push(message),
    );

    // when
    await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', key)
      .send(log('from the new app', 'mobile'));

    await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', setupA.apiKey.value)
      .send(log('from the old service'));

    // then
    expect(receivedA.map(({ data }) => data)).toEqual([
      expect.objectContaining({ app: 'mobile', message: 'from the new app' }),
      expect.objectContaining({ app: setupA.project.name, message: 'from the old service' }),
    ]);
    expect(receivedB).toHaveLength(0);

    subscriptionA.unsubscribe();
    subscriptionB.unsubscribe();
  });
});
