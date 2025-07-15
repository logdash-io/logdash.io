import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from 'src/http-monitor/read/http-monitor-read.module';
import { getEnvConfig } from 'src/shared/configs/env-configs';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import { HttpPingPingerDataService } from './http-ping-pinger.data-service';
import { HttpPingPingerService, MAX_CONCURRENT_REQUESTS_TOKEN } from './http-ping-pinger.service';

@Module({
  imports: [HttpMonitorReadModule, HttpPingWriteModule, ProjectReadModule],
  providers: [
    HttpPingPingerService,
    HttpPingPingerDataService,
    {
      provide: MAX_CONCURRENT_REQUESTS_TOKEN,
      useValue: getEnvConfig().pings.maxConcurrentRequests,
    },
  ],
  exports: [HttpPingPingerService, HttpPingPingerDataService],
})
export class HttpPingPingerModule {}
