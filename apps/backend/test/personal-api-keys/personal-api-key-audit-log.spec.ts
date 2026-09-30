import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';
import { CreatePersonalApiKeyResponse } from '../../src/personal-api-key/core/dto/create-personal-api-key.response';
import { CreateHttpMonitorBody } from '../../src/http-monitor/core/dto/create-http-monitor.body';
import { HttpMonitorSerialized } from '../../src/http-monitor/core/entities/http-monitor.interface';
import { HttpMonitorMode } from '../../src/http-monitor/core/enums/http-monitor-mode.enum';
import { AuditLogEntityAction } from '../../src/audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';

describe('Audit log (personal API keys)', () => {
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

  const body: CreateHttpMonitorBody = {
    name: 'prospect',
    url: 'https://example.com',
    mode: HttpMonitorMode.Pull,
  };

  describe('POST /projects/:projectId/http_monitors', () => {
    it('stores the id of the personal key that created the monitor', async () => {
      // given
      const { token, project, user } = await bootstrap.utils.generalUtils.setupAnonymous();
      const keyResponse = await request(bootstrap.app.getHttpServer())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          label: 'outreach',
          scopes: [{ resource: Resource.Monitors, action: Action.Write }],
          access: { kind: 'all' },
        });
      const key = keyResponse.body as CreatePersonalApiKeyResponse;

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${key.value}`)
        .send(body);

      // then
      expect(response.status).toBe(201);
      await bootstrap.utils.auditLogUtils.assertAuditLog({
        userId: user.id,
        action: AuditLogEntityAction.Create,
        relatedDomain: RelatedDomain.HttpMonitor,
        relatedEntityId: (response.body as HttpMonitorSerialized).id,
        personalApiKeyId: key.id,
      });
    });

    it('stores no personal key id when the monitor is created with a session', async () => {
      // given
      const { token, project } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post(`/projects/${project.id}/http_monitors`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      // then
      expect(response.status).toBe(201);
      const auditLog = await bootstrap.utils.auditLogUtils.assertAuditLog({
        action: AuditLogEntityAction.Create,
        relatedDomain: RelatedDomain.HttpMonitor,
        relatedEntityId: (response.body as HttpMonitorSerialized).id,
      });
      expect(auditLog.personal_api_key_id).toBeNull();
    });
  });
});
