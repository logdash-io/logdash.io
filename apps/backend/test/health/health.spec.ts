import request from 'supertest';
import { HealthController } from '../../src/health/health.controller';
import { createTestApp } from '../utils/bootstrap';

describe('HealthController', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  afterAll(async () => {
    delete process.env.SHUTDOWN_DRAIN_MS;
    await bootstrap.methods.afterAll();
  });

  it('reports healthy without auth', async () => {
    // when
    const response = await request(bootstrap.app.getHttpServer()).get('/health');

    // then
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ success: true });
  });

  it('stays healthy when shut down without SIGTERM', async () => {
    // given
    process.env.SHUTDOWN_DRAIN_MS = '10';

    // when
    await bootstrap.app.get(HealthController).beforeApplicationShutdown();
    const response = await request(bootstrap.app.getHttpServer()).get('/health');

    // then
    expect(response.status).toEqual(200);
  });

  it('reports unhealthy while draining after SIGTERM', async () => {
    // given
    process.env.SHUTDOWN_DRAIN_MS = '10';

    // when
    await bootstrap.app.get(HealthController).beforeApplicationShutdown('SIGTERM');
    const response = await request(bootstrap.app.getHttpServer()).get('/health');

    // then
    expect(response.status).toEqual(503);
  });
});
