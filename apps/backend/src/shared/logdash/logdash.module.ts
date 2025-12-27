import { Logdash } from '@logdash/node';
import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { getEnvConfig } from '../configs/env-configs';
import { AggregateLogger } from './aggregate-logger';
import { AggregateMetrics } from './aggregate-metrics';
import { AverageRecorder } from './average-metric-recorder.service';
import {
  ALL_LOGGER_TOKENS,
  API_KEYS_LOGGER,
  AUDIT_LOGS_LOGGER,
  AUTH_LOGGER,
  BLOG_LOGGER,
  CLUSTERS_LOGGER,
  CUSTOM_DNS_LOGGER,
  EMAILS_LOGGER,
  HTTP_MONITORS_LOGGER,
  HTTP_PING_BUCKETS_LOGGER,
  HTTP_PINGS_LOGGER,
  LOGDASH_METRICS,
  LOGS_LOGGER,
  METRIC_REGISTER_LOGGER,
  METRICS_LOGGER,
  NAMESPACE_MAP,
  NOTIFICATIONS_LOGGER,
  PROJECTS_LOGGER,
  REDIS_LOGGER,
  STATUS_PAGES_LOGGER,
  STRIPE_LOGGER,
  SUBSCRIPTIONS_LOGGER,
  USERS_LOGGER,
} from './logdash-tokens';

const mainLogdash = new Logdash(getEnvConfig().logdash.apiKey);
const demoLogdash = new Logdash(getEnvConfig().demo.logdashApiKey, {
  host: getEnvConfig().demo.logdashHost,
});

function createNamespacedLoggerProvider(token: symbol) {
  const namespace = NAMESPACE_MAP[token];
  return {
    provide: token,
    useFactory: () => {
      return new AggregateLogger({
        publicDataLoggers: [demoLogdash.withNamespace(namespace)],
        sensitiveDataLoggers: [mainLogdash.withNamespace(namespace)],
      });
    },
  };
}

@Global()
@Module({
  providers: [
    createNamespacedLoggerProvider(AUTH_LOGGER),
    createNamespacedLoggerProvider(USERS_LOGGER),
    createNamespacedLoggerProvider(CLUSTERS_LOGGER),
    createNamespacedLoggerProvider(PROJECTS_LOGGER),
    createNamespacedLoggerProvider(LOGS_LOGGER),
    createNamespacedLoggerProvider(METRICS_LOGGER),
    createNamespacedLoggerProvider(METRIC_REGISTER_LOGGER),
    createNamespacedLoggerProvider(HTTP_PINGS_LOGGER),
    createNamespacedLoggerProvider(HTTP_PING_BUCKETS_LOGGER),
    createNamespacedLoggerProvider(HTTP_MONITORS_LOGGER),
    createNamespacedLoggerProvider(STRIPE_LOGGER),
    createNamespacedLoggerProvider(NOTIFICATIONS_LOGGER),
    createNamespacedLoggerProvider(CUSTOM_DNS_LOGGER),
    createNamespacedLoggerProvider(SUBSCRIPTIONS_LOGGER),
    createNamespacedLoggerProvider(EMAILS_LOGGER),
    createNamespacedLoggerProvider(BLOG_LOGGER),
    createNamespacedLoggerProvider(STATUS_PAGES_LOGGER),
    createNamespacedLoggerProvider(AUDIT_LOGS_LOGGER),
    createNamespacedLoggerProvider(API_KEYS_LOGGER),
    createNamespacedLoggerProvider(REDIS_LOGGER),
    {
      provide: LOGDASH_METRICS,
      useFactory: () => {
        return new AggregateMetrics([mainLogdash, demoLogdash]);
      },
    },
    AverageRecorder,
  ],
  exports: [...ALL_LOGGER_TOKENS, LOGDASH_METRICS, AverageRecorder],
})
export class LogdashModule implements OnApplicationShutdown {
  public async onApplicationShutdown(): Promise<void> {
    await Promise.all([mainLogdash.flush(), demoLogdash.flush()]);
  }
}
