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
import { HttpMonitorEntity } from '../../src/http-monitor/core/entities/http-monitor.entity';
import { HttpMonitorCoreModule } from '../../src/http-monitor/core/http-monitor-core.module';
import { HttpPingBucketCoreModule } from '../../src/http-ping-bucket/core/http-ping-bucket-core.module';
import { HttpPingCoreModule } from '../../src/http-ping/core/http-ping-core.module';
import { MAX_CONCURRENT_REQUESTS_TOKEN } from '../../src/http-ping/schedule/http-ping-scheduler.service';
import { LogMetricEntity } from '../../src/log-metric/core/entities/log-metric.entity';
import { LogMetricCoreModule } from '../../src/log-metric/core/log-metric-core.module';
import { LogEntity } from '../../src/log/core/entities/log.entity';
import { LogCoreModule } from '../../src/log/core/log-core.module';
import { MetricRegisterEntryEntity } from '../../src/metric-register/core/entities/metric-register-entry.entity';
import { MetricRegisterCoreModule } from '../../src/metric-register/core/metric-register-core.module';
import { MetricEntity } from '../../src/metric/core/entities/metric.entity';
import { MetricCoreModule } from '../../src/metric/core/metric-core.module';
import { NotificationChannelEntity } from '../../src/notification-channel/core/entities/notification-channel.entity';
import { NotificationChannelCoreModule } from '../../src/notification-channel/core/notification-channel-core.module';
import { ProjectEntity } from '../../src/project/core/entities/project.entity';
import { ProjectCoreModule } from '../../src/project/core/project-core.module';
import { LogdashModule } from '../../src/shared/logdash/logdash.module';
import { RedisModule } from '../../src/shared/redis/redis.module';
import { RedisService } from '../../src/shared/redis/redis.service';
import { SupportCoreModule } from '../../src/support/core/support-core.module';
import { UserEntity } from '../../src/user/core/entities/user.entity';
import { UserCoreModule } from '../../src/user/core/user-core.module';
import { AuthCoreModule } from './../../src/auth/core/auth-core.module';
import { rootClickHouseTestModule } from './clickhouse-test-container-server';
import { ProjectGroupUtils } from './cluster-utils';
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

export async function createTestApp() {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      rootMongooseTestModule(),
      rootClickHouseTestModule(),
      AuthCoreModule,
      UserCoreModule,
      LogCoreModule,
      ApiKeyCoreModule,
      LogMetricCoreModule,
      ProjectCoreModule,
      ScheduleModule.forRoot(),
      MetricCoreModule,
      EventEmitterModule.forRoot(),
      LogdashModule,
      SupportCoreModule,
      HttpMonitorCoreModule,
      HttpPingCoreModule,
      HttpPingBucketCoreModule,
      ClusterCoreModule,
      MetricRegisterCoreModule,
      NotificationChannelCoreModule,
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
  const logModel: Model<LogEntity> = module.get(getModelToken(LogEntity.name));
  const logMetricModel: Model<LogMetricEntity> = module.get(getModelToken(LogMetricEntity.name));
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
  const notificationChannelModel: Model<NotificationChannelEntity> = module.get(
    getModelToken(NotificationChannelEntity.name),
  );

  const redisService: RedisService = module.get(RedisService);

  const clickhouseClient = app.get(ClickHouseClient);

  const clearDatabase = async () => {
    await Promise.all([
      userModel.deleteMany({}),
      logModel.deleteMany({}),
      logMetricModel.deleteMany({}),
      projectModel.deleteMany({}),
      metricModel.deleteMany({}),
      apiKeyModel.deleteMany({}),
      metricRegisterModel.deleteMany({}),
      httpMonitorModel.deleteMany({}),
      clusterModel.deleteMany({}),
      notificationChannelModel.deleteMany({}),
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
      logModel,
      logMetricModel,
      projectModel,
      metricModel,
      apiKeyModel,
      metricRegisterModel,
      httpMonitorModel,
      clusterModel,
      notificationChannelModel,
    },
    utils: {
      projectUtils: new ProjectUtils(app),
      httpPingUtils: new HttpPingUtils(app),
      httpPingBucketUtils: new HttpPingBucketUtils(app),
      metricUtils: new MetricUtils(app),
      logUtils: new LogUtils(app),
      httpMonitorsUtils: new HttpMonitorUtils(app),
      projectGroupUtils: new ProjectGroupUtils(app),
      generalUtils: new GeneralUtils(app),
      demoUtils: new DemoUtils(app),
      notificationChannelUtils: new NotificationChannelUtils(app),
      telegramUtils: new TelegramUtils(app),
      webhookUtils: new WebhookUtils(app),
    },
    methods: {
      clearDatabase,
      beforeEach,
      afterAll,
    },
  };
}
