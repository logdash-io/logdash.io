import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { ClusterIngestKeySerialized } from '../../src/api-key/core/entities/api-key.interface';
import { ClusterMetric, MetricSerialized } from '../../src/metric/core/entities/metric.normalized';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import { RecordMetricBody } from '../../src/metric/core/dto/record-metric.dto';

describe('Domain metrics', () => {
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

  async function readMetrics(clusterId: string, token: string): Promise<ClusterMetric[]> {
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${clusterId}/metrics`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as ClusterMetric[];
  }

  it('keeps metrics of the same name from two apps apart', async () => {
    // given
    const { cluster, token } = await bootstrap.utils.generalUtils.setupAnonymous();
    const apiKey = await readDomainKey(cluster.id, token);

    // when
    await bootstrap.utils.metricUtils.recordMetric({
      apiKey,
      name: 'requests',
      value: 3,
      operation: MetricOperation.Set,
      app: 'api',
    });
    await bootstrap.utils.metricUtils.recordMetric({
      apiKey,
      name: 'requests',
      value: 7,
      operation: MetricOperation.Set,
      app: 'web',
    });

    // then
    const metrics = await readMetrics(cluster.id, token);

    expect(metrics.map(({ name, app, value }) => [name, app, value]).sort()).toEqual([
      ['requests', 'api', 3],
      ['requests', 'web', 7],
    ]);
  });

  it('accepts the namespace that namespaced SDK loggers send with a metric', async () => {
    // given
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();
    const body: RecordMetricBody = {
      name: 'signups',
      value: 1,
      operation: MetricOperation.Change,
      namespace: 'auth',
    };

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .put('/metrics')
      .set('project-api-key', apiKey.value)
      .send(body);

    // then
    expect(response.status).toEqual(200);
  });

  it('reads the history of a metric on its domain only', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

    await bootstrap.utils.metricUtils.recordMetric({
      apiKey: await readDomainKey(setupA.cluster.id, setupA.token),
      name: 'jobs',
      value: 4,
      operation: MetricOperation.Set,
      app: 'worker',
    });

    const [metric] = await readMetrics(setupA.cluster.id, setupA.token);

    // when
    const [own, foreign] = await Promise.all([
      request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupA.cluster.id}/metrics/${metric.id}`)
        .set('Authorization', `Bearer ${setupA.token}`),
      request(bootstrap.app.getHttpServer())
        .get(`/clusters/${setupB.cluster.id}/metrics/${metric.id}`)
        .set('Authorization', `Bearer ${setupB.token}`),
    ]);

    // then
    expect(own.status).toEqual(200);
    expect((own.body as MetricSerialized[]).every(({ name }) => name === 'jobs')).toBe(true);
    expect(foreign.status).toEqual(403);
  });

  it('does not let a user from another domain read its metrics', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .get(`/clusters/${setupA.cluster.id}/metrics`)
      .set('Authorization', `Bearer ${setupB.token}`);

    // then
    expect(response.status).toEqual(403);
  });
});
