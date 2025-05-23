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
import { LogdashModule } from './shared/logdash/logdash.module';
import { RedisModule } from './shared/redis/redis.module';
import { SupportCoreModule } from './support/core/support-core.module';
import { UserCoreModule } from './user/core/user-core.module';
import { getEnvConfig } from './shared/configs/env-configs';

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
    SupportCoreModule,
    ExposedConfigModule,
    HttpMonitorCoreModule,
    HttpPingCoreModule,
    ClusterCoreModule,
    MetricRegisterCoreModule,
    RedisModule.forRoot({
      url: getEnvConfig().redis.url,
    }),
  ],
})
export class AppModule {}
