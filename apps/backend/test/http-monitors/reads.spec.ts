import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';

describe('HttpMonitorCoreController (reads)', () => {
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

  describe('GET /projects/:projectId/http_monitors', () => {
    it('reads project monitors', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: setupA.token,
        projectId: setupA.project.id,
        name: 'name 1',
      });
      await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: setupA.token,
        projectId: setupA.project.id,
        name: 'name 2',
      });
      await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token: setupB.token,
        projectId: setupB.project.id,
        name: 'name 1',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${setupA.project.id}/http_monitors`)
        .set('Authorization', `Bearer ${setupA.token}`);

      // then
      expect(response.body).toHaveLength(2);
    });

    it('denies access for non-cluster member', async () => {
      // given
      const { token: creatorToken, project } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      // then
      expect(response.status).toBe(403);
    });
  });

  describe('GET /clusters/:clusterId/http_monitors', () => {
    it('reads cluster monitors', async () => {
      // given
      const { cluster, token, project, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      const anotherProject = await bootstrap.utils.projectUtils.createDefaultProject({
        clusterId: cluster.id,
        userId: user.id,
      });

      await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: project.id,
        name: 'name 1',
      });

      await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
        token,
        projectId: anotherProject.id,
        name: 'name 2',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`);

      // then
      expect(response.body).toHaveLength(2);
      expect(response.body.some((monitor) => monitor.projectId === project.id)).toBe(true);
      expect(response.body.some((monitor) => monitor.projectId === anotherProject.id)).toBe(true);
    });

    it('denies access for non-cluster member', async () => {
      // given
      const { cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
      const { token: otherUserToken } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .get(`/clusters/${cluster.id}/http_monitors`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      // then
      expect(response.status).toBe(403);
    });
  });
});
