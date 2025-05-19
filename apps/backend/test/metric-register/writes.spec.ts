import { createTestApp } from '../utils/bootstrap';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import * as request from 'supertest';

describe('Metric Register (writes)', () => {
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

  it('removes a metric register entry and all associated metrics', async () => {
    // given
    const { apiKey, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    await bootstrap.utils.metricUtils.recordMetric({
      name: 'TestMetric',
      value: 10,
      apiKey: apiKey.value,
      operation: MetricOperation.Set,
    });

    const initialRegisterEntries =
      await bootstrap.models.metricRegisterModel.find();
    expect(initialRegisterEntries.length).toEqual(1);
    expect(initialRegisterEntries[0].name).toEqual('TestMetric');

    const initialMetrics = await bootstrap.models.metricModel.find();
    expect(initialMetrics.length).toBeGreaterThan(0);

    const registerEntryId = initialRegisterEntries[0]._id.toString();
    expect(
      initialMetrics.every((m) => m.metricRegisterEntryId === registerEntryId),
    ).toBeTruthy();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .delete(
        `/projects/${apiKey.projectId}/metric-register/${registerEntryId}`,
      )
      .set('Authorization', `Bearer ${token}`);

    // then
    expect(response.status).toEqual(200);

    const finalRegisterEntries =
      await bootstrap.models.metricRegisterModel.find();
    expect(finalRegisterEntries.length).toEqual(0);

    const finalMetrics = await bootstrap.models.metricModel.find();
    expect(finalMetrics.length).toEqual(0);
  });

  it('returns 404 when metric register entry does not exist', async () => {
    // given
    const { apiKey, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .delete(
        `/projects/${apiKey.projectId}/metric-register/507f1f77bcf86cd799439011`,
      )
      .set('Authorization', `Bearer ${token}`);

    // then
    expect(response.status).toEqual(404);
  });
});
