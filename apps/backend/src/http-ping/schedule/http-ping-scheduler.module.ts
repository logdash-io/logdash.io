import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from 'src/http-monitor/read/http-monitor-read.module';
import { getEnvConfig } from 'src/shared/configs/env-configs';
import { UserReadModule } from 'src/user/read/user-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import { HttpPingSchedulerDataService } from './http-ping-scheduler.data-service';
import {
  HttpPingSchedulerService,
  MAX_CONCURRENT_REQUESTS_TOKEN,
} from './http-ping-scheduler.service';

@Module({
  imports: [HttpMonitorReadModule, HttpPingWriteModule, ProjectReadModule, UserReadModule],
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
