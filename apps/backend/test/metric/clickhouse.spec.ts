import { Types } from 'mongoose';
import { createTestApp } from '../utils/bootstrap';
import { MetricRecordService } from '../../src/metric/record/metric-record.service';
import { MetricRegisterEntryType } from '../../src/metric-register/core/entities/metric-register-entry.entity';
import { MetricClickhouseEntity } from '../../src/metric/core/entities/metric.clickhouse-entity';

describe('Metrics (clickhouse)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let service: MetricRecordService;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    service = bootstrap.app.get(MetricRecordService);
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('records metric', async () => {
    // given
    const metric = await bootstrap.models.metricRegisterModel.create({
      _id: new Types.ObjectId(),
      projectId: '123',
      name: 'test',
      type: MetricRegisterEntryType.Counter,
      values: {
        counter: {
          absoluteValue: 15,
        },
      },
    });

    // when
    await service.recordMetrics();

    // then
    const queryResult = await bootstrap.clickhouseClient.query({
      query: `SELECT * FROM metrics`,
      format: 'JSONEachRow',
    });

    const metrics = (await queryResult.json()) as MetricClickhouseEntity[];

    expect(metrics.length).toBe(1);
    expect(metrics[0].value).toBe(15);
    expect(metrics[0].metric_register_entry_id).toBe(metric._id.toString());
    expect(metrics[0].recorded_at).toBeDefined();
  });

  it('records multiple metrics', async () => {
    // given
    const metric1 = await bootstrap.models.metricRegisterModel.create({
      _id: new Types.ObjectId(),
      projectId: '123',
      name: 'test',
      type: MetricRegisterEntryType.Counter,
      values: {
        counter: {
          absoluteValue: 15,
        },
      },
    });

    const metric2 = await bootstrap.models.metricRegisterModel.create({
      _id: new Types.ObjectId(),
      projectId: '123',
      name: 'test2',
      type: MetricRegisterEntryType.Counter,
      values: {
        counter: {
          absoluteValue: 20,
        },
      },
    });

    // when
    await service.recordMetrics();

    // then
    const queryResult = await bootstrap.clickhouseClient.query({
      query: `SELECT * FROM metrics`,
      format: 'JSONEachRow',
    });

    const metrics = (await queryResult.json()) as MetricClickhouseEntity[];

    expect(metrics.length).toBe(2);
    expect(metrics[0].value).toBe(15);
    expect(metrics[0].metric_register_entry_id).toBe(metric1._id.toString());
    expect(metrics[0].recorded_at).toBeDefined();
    expect(metrics[1].value).toBe(20);
    expect(metrics[1].metric_register_entry_id).toBe(metric2._id.toString());
    expect(metrics[1].recorded_at).toBeDefined();
  });
});
