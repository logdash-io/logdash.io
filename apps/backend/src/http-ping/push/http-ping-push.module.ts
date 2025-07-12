import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import { HttpPingPingerModule } from '../pinger/http-ping-pinger.module';
import { HttpPingPushService } from './http-ping-push.service';

@Module({
  imports: [HttpMonitorReadModule, HttpPingWriteModule, HttpPingPingerModule],
  providers: [HttpPingPushService],
  exports: [HttpPingPushService],
})
export class HttpPingPushModule {}
