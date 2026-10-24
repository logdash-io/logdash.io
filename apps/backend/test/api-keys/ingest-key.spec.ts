import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ClusterIngestKeySerialized } from '../../src/api-key/core/entities/api-key.interface';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';

describe('GET /clusters/:clusterId/ingest-key', () => {
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

  it('returns one domain key on every read, also when the first reads race', async () => {
    // given
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(bootstrap.app.getHttpServer())
          .get(`/clusters/${cluster.id}/ingest-key`)
          .set('Authorization', `Bearer ${token}`),
      ),
    );

    // then
    const values = responses.map(({ body }) => (body as ClusterIngestKeySerialized).value);

    expect(responses.map(({ status }) => status)).toEqual([200, 200, 200, 200, 200]);
    expect(values[0]).toMatch(/^ldi_/);
    expect(new Set(values).size).toEqual(1);
  });

  it('gives each domain its own key', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const [responseA, responseB] = await Promise.all([
      request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupA.cluster.id}/ingest-key`)
        .set('Authorization', `Bearer ${setupA.token}`),
      request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupB.cluster.id}/ingest-key`)
        .set('Authorization', `Bearer ${setupB.token}`),
    ]);

    // then
    expect((responseA.body as ClusterIngestKeySerialized).value).not.toEqual(
      (responseB.body as ClusterIngestKeySerialized).value,
    );
  });

  it('does not let a user from another domain read the key', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${setupA.cluster.id}/ingest-key`)
      .set('Authorization', `Bearer ${setupB.token}`);

    // then
    expect(response.status).toEqual(403);
  });

  it('stops accepting logs once its domain is deleted', async () => {
    // given
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const keyResponse = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${cluster.id}/ingest-key`)
      .set('Authorization', `Bearer ${token}`);
    const { value } = keyResponse.body as ClusterIngestKeySerialized;

    await request(bootstrap.app.getHttpServer())
      .delete(`/clusters/${cluster.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const log: CreateLogBody = {
      createdAt: new Date().toISOString(),
      message: 'after deletion',
      level: LogLevel.Info,
    };

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', value)
      .send(log);

    // then
    expect(response.status).toEqual(401);
  });
});
