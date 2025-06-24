import { RelatedDomain } from '../../src/audit-log/core/enums/related-domain.enum';
import { AuditLog } from '../../src/audit-log/creation/audit-log-creation.service';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import { createTestApp } from '../utils/bootstrap';
import { sleep } from '../utils/sleep';

describe('Audit logs (writes)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let auditLog: AuditLog;

  beforeAll(async () => {
    bootstrap = await createTestApp();
    auditLog = bootstrap.app.get(AuditLog);
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('fetches user id based on project id', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    auditLog.create({
      relatedDomain: RelatedDomain.Project,
      relatedEntityId: setup.project.id,
    });

    // then
    await bootstrap.utils.auditLogUtils.assertAuditLog({
      userId: setup.user.id,
      relatedDomain: RelatedDomain.Project,
      relatedEntityId: setup.project.id,
    });
  });

  it('fetches user id based on cluster id', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    auditLog.create({
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: setup.cluster.id,
    });

    // then
    await bootstrap.utils.auditLogUtils.assertAuditLog({
      userId: setup.user.id,
      relatedDomain: RelatedDomain.Cluster,
      relatedEntityId: setup.cluster.id,
    });
  });

  it('fetches user id based on metric id', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();

    const metric = await bootstrap.utils.metricUtils.recordMetric({
      apiKey: setup.apiKey.value,
      name: 'test',
      operation: MetricOperation.Set,
      value: 1,
    });

    const metricRegisterEntry = await bootstrap.models.metricRegisterModel.findOne({
      projectId: setup.project.id,
    });

    // when
    auditLog.create({
      relatedDomain: RelatedDomain.Metric,
      relatedEntityId: metricRegisterEntry?.id,
    });

    // then
    await bootstrap.utils.auditLogUtils.assertAuditLog({
      userId: setup.user.id,
      relatedDomain: RelatedDomain.Metric,
      relatedEntityId: metricRegisterEntry?.id,
    });
  });

  it('applies rate limit', async () => {
    // given
    const setup = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    await Promise.all(
      Array.from({ length: 1000 }).map(async () => {
        try {
          await auditLog.create({
            userId: setup.user.id,
            relatedDomain: RelatedDomain.Project,
            relatedEntityId: setup.project.id,
          });
        } catch {}
      }),
    );

    // then
    const count = await bootstrap.utils.auditLogUtils.countUserAuditLogs(setup.user.id);

    expect(count).toBe(600);
  }, 10_000);
});
