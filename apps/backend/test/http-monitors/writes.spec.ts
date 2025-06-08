import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { getProjectPlanConfig } from '../../src/shared/configs/project-plan-configs';

describe('HttpMonitorCoreController (writes)', () => {
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

  it('creates new monitor', async () => {
    // given
    const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
    const dtoStub = { name: 'some name', url: 'https://google.com' };

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post(`/projects/${project.id}/http_monitors`)
      .set('Authorization', `Bearer ${token}`)
      .send(dtoStub);

    // then
    const entity = await bootstrap.models.httpMonitorModel.findOne();
    expect(entity).toMatchObject({
      ...dtoStub,
      projectId: project.id,
    });
  });

  it('throws error for invalid url', async () => {
    // given
    const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
    const dtoStub = { name: 'Test Monitor', url: 'https://example.com/<>' };

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post(`/projects/${project.id}/http_monitors`)
      .set('Authorization', `Bearer ${token}`)
      .send(dtoStub);

    // then
    expect(response.status).toBe(400);
  });

  it('throws error when cluster has reached monitor limit', async () => {
    // given
    const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();
    const maxMonitors = getProjectPlanConfig(project.tier).httpMonitors.maxNumberOfMonitors;

    // Create monitors up to the limit
    for (let i = 0; i < maxMonitors; i++) {
      await bootstrap.models.httpMonitorModel.create({
        projectId: project.id,
        name: `Monitor ${i}`,
        url: 'https://example.com',
      });
    }

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post(`/projects/${project.id}/http_monitors`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'One More Monitor', url: 'https://example.com' });

    // then
    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      'You have reached the maximum number of monitors for this project',
    );
  });

  it('denies access for non-cluster member', async () => {
    // given
    const { token: creatorToken, project } = await bootstrap.utils.generalUtils.setupAnonymous();
    const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post(`/projects/${project.id}/http_monitors`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ name: 'Test Monitor', url: 'https://example.com' });

    // then
    expect(response.status).toBe(403);
  });
});
