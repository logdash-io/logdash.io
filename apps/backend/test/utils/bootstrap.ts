import { ClickHouseClient } from '@clickhouse/client';
import { Logger, Metrics } from '@logdash/js-sdk';
import { ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { clear } from 'jest-date-mock';
import { Model } from 'mongoose';
import * as nock from 'nock';
import { ApiKeyCoreModule } from '../../src/api-key/core/api-key-core.module';
import { ApiKeyEntity } from '../../src/api-key/core/entities/api-key.entity';
import { ClusterCoreModule } from '../../src/cluster/core/cluster-core.module';
import { ClusterEntity } from '../../src/cluster/core/entities/cluster.entity';
import { ClusterInviteCoreModule } from '../../src/cluster-invite/core/cluster-invite-core.module';
import { ClusterInviteEntity } from '../../src/cluster-invite/core/entities/cluster-invite.entity';
import { HttpMonitorEntity } from '../../src/http-monitor/core/entities/http-monitor.entity';
import { HttpMonitorCoreModule } from '../../src/http-monitor/core/http-monitor-core.module';
import { HttpPingBucketCoreModule } from '../../src/http-ping-bucket/core/http-ping-bucket-core.module';
import { HttpPingCoreModule } from '../../src/http-ping/core/http-ping-core.module';
import { MAX_CONCURRENT_REQUESTS_TOKEN } from '../../src/http-ping/schedule/http-ping-scheduler.service';
import { LogCoreModule } from '../../src/log/core/log-core.module';
import { MetricRegisterEntryEntity } from '../../src/metric-register/core/entities/metric-register-entry.entity';
import { MetricRegisterCoreModule } from '../../src/metric-register/core/metric-register-core.module';
import { MetricEntity } from '../../src/metric/core/entities/metric.entity';
import { MetricCoreModule } from '../../src/metric/core/metric-core.module';
import { NotificationChannelEntity } from '../../src/notification-channel/core/entities/notification-channel.entity';
import { NotificationChannelCoreModule } from '../../src/notification-channel/core/notification-channel-core.module';
import { PublicDashboardEntity } from '../../src/public-dashboard/core/entities/public-dashboard.entity';
import { PublicDashboardCoreModule } from '../../src/public-dashboard/core/public-dashboard-core.module';
import { ProjectEntity } from '../../src/project/core/entities/project.entity';
import { ProjectCoreModule } from '../../src/project/core/project-core.module';
import { LogdashModule } from '../../src/shared/logdash/logdash.module';
import { RedisModule } from '../../src/shared/redis/redis.module';
import { RedisService } from '../../src/shared/redis/redis.service';
import { UserEntity } from '../../src/user/core/entities/user.entity';
import { UserCoreModule } from '../../src/user/core/user-core.module';
import { AuthCoreModule } from './../../src/auth/core/auth-core.module';
import { rootClickHouseTestModule } from './clickhouse-test-container-server';
import { ClusterUtils } from './cluster-utils';
import { NotificationChannelUtils } from './communication-channel-utils';
import { DemoUtils } from './demo';
import { GeneralUtils } from './general';
import { HttpMonitorUtils } from './http-monitor-utils';
import { HttpPingBucketUtils } from './http-ping-bucket-utils';
import { HttpPingUtils } from './http-ping-utils';
import { LogUtils } from './log-utils';
import { LoggerMock } from './logger-mock';
import { MetricUtils } from './metric-utils';
import { MetricsMock } from './metrics-mock';
import { closeInMemoryMongoServer, rootMongooseTestModule } from './mongo-in-memory-server';
import { ProjectUtils } from './project-utils';
import { getRedisTestContainerUrl } from './redis-test-container-server';
import { TelegramUtils } from './telegram-utils';
import { WebhookUtils } from './webhook-utils';
import { PublicDashboardUtils } from './public-dashboard-utils';
import { ClusterInviteUtils } from './cluster-invite-utils';
import { StripeModule } from '../../src/payments/stripe/stripe.module';
import { SubscriptionEntity } from '../../src/subscription/core/entities/subscription.entity';
import { SubscriptionCoreModule } from '../../src/subscription/core/subscription-core.module';
import { AuditLogUtils } from './audit-log-utils';
import { AuditLogCreationModule } from '../../src/audit-log/creation/audit-log-creation.module';
import { UserUtils } from './user.utils';

export async function createTestApp() {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      rootMongooseTestModule(),
      rootClickHouseTestModule(),
      AuthCoreModule,
      UserCoreModule,
      LogCoreModule,
      ApiKeyCoreModule,
      ProjectCoreModule,
      ScheduleModule.forRoot(),
      MetricCoreModule,
      EventEmitterModule.forRoot(),
      LogdashModule,
      HttpMonitorCoreModule,
      HttpPingCoreModule,
      HttpPingBucketCoreModule,
      ClusterCoreModule,
      ClusterInviteCoreModule,
      MetricRegisterCoreModule,
      NotificationChannelCoreModule,
      PublicDashboardCoreModule,
      StripeModule,
      SubscriptionCoreModule,
      AuditLogCreationModule,
      RedisModule.forRoot({
        url: getRedisTestContainerUrl(),
      }),
    ],
  })
    .overrideProvider(Logger)
    .useClass(LoggerMock)
    .overrideProvider(Metrics)
    .useClass(MetricsMock)
    .overrideProvider(MAX_CONCURRENT_REQUESTS_TOKEN)
    .useValue(2)
    .compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.init();

  const userModel: Model<UserEntity> = module.get(getModelToken(UserEntity.name));
  const projectModel: Model<ProjectEntity> = module.get(getModelToken(ProjectEntity.name));
  const metricModel: Model<MetricEntity> = module.get(getModelToken(MetricEntity.name));
  const apiKeyModel: Model<ApiKeyEntity> = module.get(getModelToken(ApiKeyEntity.name));
  const metricRegisterModel: Model<MetricRegisterEntryEntity> = module.get(
    getModelToken(MetricRegisterEntryEntity.name),
  );
  const httpMonitorModel: Model<HttpMonitorEntity> = module.get(
    getModelToken(HttpMonitorEntity.name),
  );
  const clusterModel: Model<ClusterEntity> = module.get(getModelToken(ClusterEntity.name));
  const clusterInviteModel: Model<ClusterInviteEntity> = module.get(
    getModelToken(ClusterInviteEntity.name),
  );
  const notificationChannelModel: Model<NotificationChannelEntity> = module.get(
    getModelToken(NotificationChannelEntity.name),
  );
  const publicDashboardModel: Model<PublicDashboardEntity> = module.get(
    getModelToken(PublicDashboardEntity.name),
  );
  const subscriptionModel: Model<SubscriptionEntity> = module.get(
    getModelToken(SubscriptionEntity.name),
  );

  const redisService: RedisService = module.get(RedisService);

  const clickhouseClient = app.get(ClickHouseClient);

  const clearDatabase = async () => {
    await Promise.all([
      userModel.deleteMany({}),
      projectModel.deleteMany({}),
      metricModel.deleteMany({}),
      apiKeyModel.deleteMany({}),
      metricRegisterModel.deleteMany({}),
      httpMonitorModel.deleteMany({}),
      clusterModel.deleteMany({}),
      clusterInviteModel.deleteMany({}),
      notificationChannelModel.deleteMany({}),
      publicDashboardModel.deleteMany({}),
      subscriptionModel.deleteMany({}),
      redisService.flushAll(),
      clickhouseClient.query({
        query: `TRUNCATE TABLE logs`,
      }),
      clickhouseClient.query({
        query: `TRUNCATE TABLE http_pings`,
      }),
      clickhouseClient.query({
        query: `TRUNCATE TABLE http_ping_buckets`,
      }),
      clickhouseClient.query({
        query: `TRUNCATE TABLE audit_logs`,
      }),
    ]);
  };

  const beforeEach = async () => {
    clear();
    await clearDatabase();
    nock.cleanAll();
  };

  const afterAll = async () => {
    await app.close();
    await closeInMemoryMongoServer();
    clear();
  };

  return {
    app,
    module,
    models: {
      userModel,
      projectModel,
      metricModel,
      apiKeyModel,
      metricRegisterModel,
      httpMonitorModel,
      clusterModel,
      clusterInviteModel,
      notificationChannelModel,
      publicDashboardModel,
      subscriptionModel,
    },
    utils: {
      projectUtils: new ProjectUtils(app),
      httpPingUtils: new HttpPingUtils(app),
      httpPingBucketUtils: new HttpPingBucketUtils(app),
      metricUtils: new MetricUtils(app),
      logUtils: new LogUtils(app),
      httpMonitorsUtils: new HttpMonitorUtils(app),
      projectGroupUtils: new ClusterUtils(app),
      generalUtils: new GeneralUtils(app),
      demoUtils: new DemoUtils(app),
      notificationChannelUtils: new NotificationChannelUtils(app),
      telegramUtils: new TelegramUtils(app),
      webhookUtils: new WebhookUtils(app),
      publicDashboardUtils: new PublicDashboardUtils(app),
      auditLogUtils: new AuditLogUtils(app),
      clusterInviteUtils: new ClusterInviteUtils(app),
      userUtils: new UserUtils(app),
    },
    methods: {
      clearDatabase,
      beforeEach,
      afterAll,
    },
  };
}
