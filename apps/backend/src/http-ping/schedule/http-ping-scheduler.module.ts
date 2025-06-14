import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from 'src/http-monitor/read/http-monitor-read.module';
import { getEnvConfig } from 'src/shared/configs/env-configs';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import {
  HttpPingSchedulerService,
  MAX_CONCURRENT_REQUESTS_TOKEN,
} from './http-ping-scheduler.service';
import { HttpPingSchedulerDataService } from './http-ping-scheduler.data-service';
import { ProjectReadModule } from '../../project/read/project-read.module';

@Module({
  imports: [HttpMonitorReadModule, HttpPingWriteModule, ProjectReadModule],
  providers: [
    HttpPingSchedulerService,
    HttpPingSchedulerDataService,
    {
      provide: MAX_CONCURRENT_REQUESTS_TOKEN,
      useValue: getEnvConfig().pings.maxConcurrentRequests,
    },
  ],
  exports: [HttpPingSchedulerService],
})
export class HttpPingSchedulerModule {}
