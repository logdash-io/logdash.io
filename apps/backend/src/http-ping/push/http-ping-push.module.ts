import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import { HttpPingPingerModule } from '../pinger/http-ping-pinger.module';
import { HttpPingPushService } from './http-ping-push.service';
import { ProjectReadModule } from 'src/project/read/project-read.module';

@Module({
  imports: [HttpMonitorReadModule, HttpPingWriteModule, HttpPingPingerModule, ProjectReadModule],
  providers: [HttpPingPushService],
  exports: [HttpPingPushService],
})
export class HttpPingPushModule {}
