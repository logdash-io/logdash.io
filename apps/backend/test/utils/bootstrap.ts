import { ClickHouseClient } from '@clickhouse/client';
import { ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { clear } from 'jest-date-mock';
import { Model } from 'mongoose';
import * as nock from 'nock';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageService } from '@nestjs/throttler/dist/throttler.service';
import { ThrottlingModule } from '../../src/shared/throttling/throttling.module';
import { ApiKeyCoreModule } from '../../src/api-key/core/api-key-core.module';
import { ApiKeyEntity } from '../../src/api-key/core/entities/api-key.entity';
import { PersonalApiKeyCoreModule } from '../../src/personal-api-key/core/personal-api-key-core.module';
import { CliAuthModule } from '../../src/cli-auth/core/cli-auth.module';
import { OverviewCoreModule } from '../../src/overview/core/overview-core.module';
import { PersonalApiKeyEntity } from '../../src/personal-api-key/core/entities/personal-api-key.entity';
import { ClusterCoreModule } from '../../src/cluster/core/cluster-core.module';
import { ClusterEntity } from '../../src/cluster/core/entities/cluster.entity';
import { ClusterInviteCoreModule } from '../../src/cluster-invite/core/cluster-invite-core.module';
import { ClusterInviteEntity } from '../../src/cluster-invite/core/entities/cluster-invite.entity';
import { HttpMonitorEntity } from '../../src/http-monitor/core/entities/http-monitor.entity';
import { HttpMonitorCoreModule } from '../../src/http-monitor/core/http-monitor-core.module';
import { HttpPingBucketCoreModule } from '../../src/http-ping-bucket/core/http-ping-bucket-core.module';
import { HttpPingCoreModule } from '../../src/http-ping/core/http-ping-core.module';
import { LogCoreModule } from '../../src/log/core/log-core.module';
import { MetricRegisterEntryEntity } from '../../src/metric-register/core/entities/metric-register-entry.entity';
import { MetricRegisterCoreModule } from '../../src/metric-register/core/metric-register-core.module';
import { MetricEntity } from '../../src/metric/core/entities/metric.entity';
import { MetricCoreModule } from '../../src/metric/core/metric-core.module';
import { NotificationChannelEntity } from '../../src/notification-channel/core/entities/notification-channel.entity';
import { NotificationChannelCoreModule } from '../../src/notification-channel/core/notification-channel-core.module';
import { PublicDashboardEntity } from '../../src/public-dashboard/core/entities/public-dashboard.entity';
import { PublicDashboardCoreModule } from '../../src/public-dashboard/core/public-dashboard-core.module';
import { BlogPostEntity } from '../../src/blog/core/entities/blog-post.entity';
import { BlogCoreModule } from '../../src/blog/core/blog-core.module';
import { CustomDomainCoreModule } from '../../src/custom-domain/core/custom-domain-core.module';
import { CustomDomainEntity } from '../../src/custom-domain/core/entities/custom-domain.entity';
import { CustomDomainDnsService } from '../../src/custom-domain/dns/custom-domain-dns.service';
import { CustomDomainDnsServiceMock } from '../../src/custom-domain/dns/custom-domain-dns.service.mock';
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
import { CustomDomainUtils } from './custom-domain-utils';
import { BlogUtils } from './blog-utils';
import { ClusterInviteUtils } from './cluster-invite-utils';
import { StripeModule } from '../../src/payments/stripe/stripe.module';
import { SubscriptionEntity } from '../../src/subscription/core/entities/subscription.entity';
import { SubscriptionCoreModule } from '../../src/subscription/core/subscription-core.module';
import { AuditLogUtils } from './audit-log-utils';
import { AuditLogCreationModule } from '../../src/audit-log/creation/audit-log-creation.module';
import { UserUtils } from './user.utils';
import { MAX_CONCURRENT_REQUESTS_TOKEN } from '../../src/http-ping/pinger/http-ping-pinger.service';
import { ALL_LOGGER_TOKENS, LOGDASH_METRICS } from '../../src/shared/logdash/logdash-tokens';

export async function createTestApp() {
  let moduleBuilder = Test.createTestingModule({
    imports: [
      rootMongooseTestModule(),
      rootClickHouseTestModule(),
      ThrottlingModule,
      AuthCoreModule,
      UserCoreModule,
      LogCoreModule,
      ApiKeyCoreModule,
      PersonalApiKeyCoreModule,
      CliAuthModule,
      OverviewCoreModule,
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
      CustomDomainCoreModule,
      BlogCoreModule,
      StripeModule,
      SubscriptionCoreModule,
      AuditLogCreationModule,
      RedisModule.forRoot({
        url: getRedisTestContainerUrl(),
      }),
    ],
  });

  // Override all logger tokens with the mock
  for (const token of ALL_LOGGER_TOKENS) {
    moduleBuilder = moduleBuilder.overrideProvider(token).useClass(LoggerMock);
  }

  // Override metrics token with the mock
  moduleBuilder = moduleBuilder
    .overrideProvider(LOGDASH_METRICS)
    .useClass(MetricsMock)
    .overrideProvider(MAX_CONCURRENT_REQUESTS_TOKEN)
    .useValue(2)
    .overrideProvider(CustomDomainDnsService)
    .useClass(CustomDomainDnsServiceMock);

  const module: TestingModule = await moduleBuilder.compile();

  const app = module.createNestApplication();
  // Must mirror src/main.ts, otherwise e2e tests exercise different validation
  // rules than production.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  const userModel: Model<UserEntity> = module.get(getModelToken(UserEntity.name));
  const projectModel: Model<ProjectEntity> = module.get(getModelToken(ProjectEntity.name));
  const metricModel: Model<MetricEntity> = module.get(getModelToken(MetricEntity.name));
  const apiKeyModel: Model<ApiKeyEntity> = module.get(getModelToken(ApiKeyEntity.name));
  const personalApiKeyModel: Model<PersonalApiKeyEntity> = module.get(
    getModelToken(PersonalApiKeyEntity.name),
  );
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
  const customDomainModel: Model<CustomDomainEntity> = module.get(
    getModelToken(CustomDomainEntity.name),
  );
  const subscriptionModel: Model<SubscriptionEntity> = module.get(
    getModelToken(SubscriptionEntity.name),
  );
  const blogPostModel: Model<BlogPostEntity> = module.get(getModelToken(BlogPostEntity.name));

  const redisService: RedisService = module.get(RedisService);

  const clickhouseClient = app.get(ClickHouseClient);

  const throttlerStorage: ThrottlerStorageService = module.get(ThrottlerStorage);

  const resetRateLimits = () => {
    // Account creation is rate limited per IP (10/min) and every e2e request
    // comes from 127.0.0.1, so a suite of >10 tests would otherwise start
    // getting 429s. `storage.clear()` alone leaves the per-hit expiry timers
    // scheduled, and they dereference the removed record when they fire -
    // `onApplicationShutdown()` cancels them.
    throttlerStorage.onApplicationShutdown();
    throttlerStorage.storage.clear();
  };

  const clearDatabase = async () => {
    // Several specs call clearDatabase() directly instead of going through
    // methods.beforeEach(), so the rate-limit reset lives here to cover both.
    resetRateLimits();

    await Promise.all([
      userModel.deleteMany({}),
      projectModel.deleteMany({}),
      metricModel.deleteMany({}),
      apiKeyModel.deleteMany({}),
      personalApiKeyModel.deleteMany({}),
      metricRegisterModel.deleteMany({}),
      httpMonitorModel.deleteMany({}),
      clusterModel.deleteMany({}),
      clusterInviteModel.deleteMany({}),
      notificationChannelModel.deleteMany({}),
      publicDashboardModel.deleteMany({}),
      customDomainModel.deleteMany({}),
      subscriptionModel.deleteMany({}),
      blogPostModel.deleteMany({}),
      redisService.flushAll(),
      // `command()` rather than `query()`: query() leaves the response stream
      // undrained, so the TRUNCATE can land *after* the next test has started
      // writing and silently wipe its rows.
      clickhouseClient.command({ query: `TRUNCATE TABLE logs` }),
      clickhouseClient.command({ query: `TRUNCATE TABLE http_pings` }),
      clickhouseClient.command({ query: `TRUNCATE TABLE http_ping_buckets` }),
      clickhouseClient.command({ query: `TRUNCATE TABLE audit_logs` }),
      clickhouseClient.command({ query: `TRUNCATE TABLE metrics` }),
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
      personalApiKeyModel,
      metricRegisterModel,
      httpMonitorModel,
      clusterModel,
      clusterInviteModel,
      notificationChannelModel,
      publicDashboardModel,
      customDomainModel,
      subscriptionModel,
      blogPostModel,
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
      customDomainUtils: new CustomDomainUtils(app),
      auditLogUtils: new AuditLogUtils(app),
      clusterInviteUtils: new ClusterInviteUtils(app),
      userUtils: new UserUtils(app),
      blogUtils: new BlogUtils(app),
    },
    methods: {
      clearDatabase,
      beforeEach,
      afterAll,
    },
    clickhouseClient: app.get(ClickHouseClient),
  };
}
