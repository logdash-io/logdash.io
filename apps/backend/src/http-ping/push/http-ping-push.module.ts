import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import { HttpPingPingerModule } from '../pinger/http-ping-pinger.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpPingPushService } from './http-ping-push.service';
import { HttpPingPushController } from './http-ping-push.controller';

@Module({
  imports: [
    HttpMonitorReadModule,
    HttpPingWriteModule,
    HttpPingPingerModule,
    ...ClusterMemberGuardImports,
  ],
  providers: [HttpPingPushService],
  controllers: [HttpPingPushController],
  exports: [HttpPingPushService],
})
export class HttpPingPushModule {}
