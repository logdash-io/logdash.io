import { MongoClient } from 'mongodb';
import request from 'supertest';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import { createTestApp } from '../utils/bootstrap';

describe('Graceful shutdown', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('flushes queued logs and metrics when the app closes', async () => {
    // given
    await bootstrap.methods.beforeEach();
    const { apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();
    const server = bootstrap.app.getHttpServer();

    await request(server)
      .post('/logs')
      .set('project-api-key', apiKey.value)
      .send({
        createdAt: new Date().toISOString(),
        message: 'queued before shutdown',
        level: LogLevel.Info,
      })
      .expect(201);
    await request(server)
      .put('/metrics')
      .set('project-api-key', apiKey.value)
      .send({ name: 'users', value: 1, operation: MetricOperation.Set })
      .expect(200);

    const { host, port, name } = bootstrap.models.metricModel.db;
    const metricsCollection = bootstrap.models.metricModel.collection.name;

    // when
    await bootstrap.app.close();

    // then
    const logs = await bootstrap.clickhouseClient.query({
      query: `SELECT message FROM logs`,
      format: 'JSONEachRow',
    });
    expect(await logs.json()).toEqual([{ message: 'queued before shutdown' }]);

    const mongo = await MongoClient.connect(`mongodb://${host}:${port}`);
    const metricCount = await mongo.db(name).collection(metricsCollection).countDocuments();
    await mongo.close();
    expect(metricCount).toBeGreaterThan(0);
  });
});
