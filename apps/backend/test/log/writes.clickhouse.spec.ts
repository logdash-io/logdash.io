import * as request from 'supertest';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { createTestApp } from '../utils/bootstrap';
import { sleep } from '../utils/sleep';
import { ClickHouseClient } from '@clickhouse/client';
import { ClickhouseUtils } from '../../src/clickhouse/clickhouse.utils';

describe('LogCoreController (writes) - Clickhouse', () => {
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

  it('stores log', async () => {
    // given
    const { apiKey, project } = await bootstrap.utils.generalUtils.setupAnonymous();

    const date = new Date();

    const createLogDto: CreateLogBody = {
      createdAt: date.toISOString(),
      message: 'test',
      level: LogLevel.Info,
      sequenceNumber: 2137,
    };

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post('/logs')
      .set('project-api-key', apiKey.value)
      .send(createLogDto);

    expect(response.body.success).toEqual(true);

    await sleep(1000);

    const clickhouseClient = bootstrap.app.get(ClickHouseClient);

    const result = await clickhouseClient.query({
      query: `SELECT * FROM logs`,
    });

    const data = ((await result.json()) as any).data;

    const row = data[0];

    expect(row.id).toHaveLength(24);
    expect(row.project_id).toEqual(project.id);
    expect(ClickhouseUtils.clickhouseDateToJsDate(row.created_at).toISOString()).toEqual(
      date.toISOString(),
    );
    expect(row.message).toEqual(createLogDto.message);
    expect(row.level).toEqual(createLogDto.level);
    expect(row.sequence_number).toEqual(createLogDto.sequenceNumber);
  });
});
