import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from 'src/http-monitor/read/http-monitor-read.module';
import { getEnvConfig } from 'src/shared/configs/env-configs';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import {
  HttpPingSchedulerService,
  MAX_CONCURRENT_REQUESTS_TOKEN,
} from './http-ping-scheduler.service';

@Module({
  imports: [HttpMonitorReadModule, HttpPingWriteModule],
  providers: [
    HttpPingSchedulerService,
    {
      provide: MAX_CONCURRENT_REQUESTS_TOKEN,
      useValue: getEnvConfig().pings.maxConcurrentRequests,
    },
  ],
})
export class HttpPingSchedulerModule {}
