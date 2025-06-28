import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiKeyCoreModule } from './api-key/core/api-key-core.module';
import { AuthCoreModule } from './auth/core/auth-core.module';
import { ClusterCoreModule } from './cluster/core/cluster-core.module';
import { ResendModule } from './email/resend/resend.module';
import { ExposedConfigModule } from './exposed-config/exposed-config.module';
import { HttpMonitorCoreModule } from './http-monitor/core/http-monitor-core.module';
import { HttpPingCoreModule } from './http-ping/core/http-ping-core.module';
import { LogMetricCoreModule } from './log-metric/core/log-metric-core.module';
import { LogCoreModule } from './log/core/log-core.module';
import { MetricRegisterCoreModule } from './metric-register/core/metric-register-core.module';
import { MetricCoreModule } from './metric/core/metric-core.module';
import { StripeModule } from './payments/stripe/stripe.module';
import { ProjectCoreModule } from './project/core/project-core.module';
import { getEnvConfig } from './shared/configs/env-configs';
import { LogdashModule } from './shared/logdash/logdash.module';
import { RedisModule } from './shared/redis/redis.module';
import { SupportCoreModule } from './support/core/support-core.module';
import { UserCoreModule } from './user/core/user-core.module';
import { ClickhouseModule } from './clickhouse/clickhouse.module';
import { NotificationChannelCoreModule } from './notification-channel/core/notification-channel-core.module';
import { HttpPingBucketCoreModule } from './http-ping-bucket/core/http-ping-bucket-core.module';
import { PublicDashboardCoreModule } from './public-dashboard/core/public-dashboard-core.module';
import { SubscriptionCoreModule } from './subscription/core/subscription-core.module';
import { AuditLogCreationModule } from './audit-log/creation/audit-log-creation.module';
import { ClusterInviteCoreModule } from './cluster-invite/core/cluster-invite-core.module';

@Module({
  imports: [
    MongooseModule.forRoot(getEnvConfig().mongo.url),
    LogdashModule,
    AuthCoreModule,
    UserCoreModule,
    LogCoreModule,
    ScheduleModule.forRoot(),
    ApiKeyCoreModule,
    LogMetricCoreModule,
    ProjectCoreModule,
    MetricCoreModule,
    EventEmitterModule.forRoot(),
    ResendModule,
    StripeModule,
    SubscriptionCoreModule,
    SupportCoreModule,
    ExposedConfigModule,
    HttpMonitorCoreModule,
    HttpPingCoreModule,
    HttpPingBucketCoreModule,
    ClusterCoreModule,
    MetricRegisterCoreModule,
    RedisModule.forRoot({
      url: getEnvConfig().redis.url,
    }),
    ClickhouseModule,
    NotificationChannelCoreModule,
    PublicDashboardCoreModule,
    AuditLogCreationModule,
    ClusterInviteCoreModule,
  ],
})
export class AppModule {}
