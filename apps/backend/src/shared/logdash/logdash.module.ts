import { createLogDash, Metrics, Logger } from '@logdash/js-sdk';
import { Global, Module } from '@nestjs/common';
import { getEnvConfig } from '../configs/env-configs';
import { AggregateLogger } from './aggregate-logger';
import { AggregateMetrics } from './aggregate-metrics';
import { AverageRecorder } from './average-metric-recorder.service';

@Global()
@Module({
  providers: [
    {
      provide: Logger,
      useFactory: () => {
        const { logger } = createLogDash({
          apiKey: getEnvConfig().logdash.apiKey,
        });

        const { logger: demoLogger } = createLogDash({
          apiKey: getEnvConfig().demo.logdashApiKey,
          host: getEnvConfig().demo.logdashHost,
        });

        return new AggregateLogger({
          publicDataLoggers: [demoLogger],
          sensitiveDataLoggers: [logger],
        });
      },
    },
    {
      provide: Metrics,
      useFactory: () => {
        const { metrics } = createLogDash({
          apiKey: getEnvConfig().logdash.apiKey,
        });

        const { metrics: demoMetrics } = createLogDash({
          apiKey: getEnvConfig().demo.logdashApiKey,
          host: getEnvConfig().demo.logdashHost,
        });

        return new AggregateMetrics([metrics, demoMetrics]);
      },
    },
    AverageRecorder,
  ],
  exports: [Logger, Metrics, AverageRecorder],
})
export class LogdashModule {}
