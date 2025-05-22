import { addHours, subDays } from 'date-fns';
import { Types } from 'mongoose';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import { AccountClaimStatus } from '../../src/user/core/enum/account-claim-status.enum';
import { UserTtlService } from '../../src/user/ttl/user-ttl.service';
import { createTestApp } from '../utils/bootstrap';

describe('UserTtlService', () => {
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

  it('does not remove users before threshold', async () => {
    const service = bootstrap.app.get(UserTtlService);

    // given
    const safeRangeDate = addHours(subDays(new Date(), 7), 1);

    const userInSafeRange = await bootstrap.models.userModel.create({
      createdAt: safeRangeDate,
      accountClaimStatus: AccountClaimStatus.Anonymous,
    });

    // when
    await service.deleteOldUnclaimedUsers();

    // then
    const user = await bootstrap.models.userModel.findById(userInSafeRange._id);
    expect(user).not.toBeNull();
  });

  it('removes user after threshold', async () => {
    const service = bootstrap.app.get(UserTtlService);

    // given
    const { user, apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

    await bootstrap.models.userModel.updateOne(
      { _id: new Types.ObjectId(user.id) },
      {
        createdAt: subDays(new Date(), 9),
      },
      { timestamps: false },
    );

    const log = await bootstrap.utils.logUtils.createLog({
      apiKey: apiKey.value,
      createdAt: new Date().toISOString(),
      message: 'testLog',
      level: LogLevel.Silly,
    });

    const metric = await bootstrap.utils.metricUtils.recordMetric({
      apiKey: apiKey.value,
      name: 'testMetric',
      operation: MetricOperation.Change,
      value: 1,
    });

    const cluster = await bootstrap.models.clusterModel.findOne({ creatorId: user.id });
    if (!cluster) {
      throw new Error('Cluster not found for user');
    }

    const httpMonitor = await bootstrap.models.httpMonitorModel.create({
      clusterId: cluster._id,
      name: 'Test Monitor',
      url: 'https://example.com',
    });

    const httpPing = await bootstrap.models.httpPingModel.create({
      clusterId: cluster._id,
      httpMonitorId: httpMonitor._id,
      statusCode: 200,
      responseTimeMs: 100,
      message: 'OK',
    });

    const logsBeforeRemoval = await bootstrap.models.logModel.find();
    const metricsBeforeRemoval = await bootstrap.models.metricModel.find();
    const logMetricsBeforeRemoval = await bootstrap.models.logMetricModel.find();
    const metricRegisterEntriesBeforeRemoval = await bootstrap.models.metricRegisterModel.find();
    const projectsBeforeRemoval = await bootstrap.models.projectModel.find();
    const clustersBeforeRemoval = await bootstrap.models.clusterModel.find();
    const httpMonitorsBeforeRemoval = await bootstrap.models.httpMonitorModel.find();
    const httpPingsBeforeRemoval = await bootstrap.models.httpPingModel.find();

    // when
    await service.deleteOldUnclaimedUsers();

    // then
    const logsAfterRemoval = await bootstrap.models.logModel.find();
    const metricsAfterRemoval = await bootstrap.models.metricModel.find();
    const logMetricsAfterRemoval = await bootstrap.models.logMetricModel.find();
    const metricRegisterEntriesAfterRemoval = await bootstrap.models.metricRegisterModel.find();
    const projectsAfterRemoval = await bootstrap.models.projectModel.find();
    const clustersAfterRemoval = await bootstrap.models.clusterModel.find();
    const httpMonitorsAfterRemoval = await bootstrap.models.httpMonitorModel.find();
    const httpPingsAfterRemoval = await bootstrap.models.httpPingModel.find();

    expect(logsBeforeRemoval).toHaveLength(1);
    expect(metricsBeforeRemoval).toHaveLength(4);
    expect(logMetricsBeforeRemoval).toHaveLength(4);
    expect(metricRegisterEntriesBeforeRemoval).toHaveLength(1);
    expect(projectsBeforeRemoval).toHaveLength(1);
    expect(clustersBeforeRemoval).toHaveLength(1);
    expect(httpMonitorsBeforeRemoval).toHaveLength(1);
    expect(httpPingsBeforeRemoval).toHaveLength(1);

    expect(logsAfterRemoval).toHaveLength(0);
    expect(metricsAfterRemoval).toHaveLength(0);
    expect(logMetricsAfterRemoval).toHaveLength(0);
    expect(metricRegisterEntriesAfterRemoval).toHaveLength(0);
    expect(projectsAfterRemoval).toHaveLength(0);
    expect(clustersAfterRemoval).toHaveLength(0);
    expect(httpMonitorsAfterRemoval).toHaveLength(0);
    expect(httpPingsAfterRemoval).toHaveLength(0);
  });
});
