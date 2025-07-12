import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpMonitorReadModule } from 'src/http-monitor/read/http-monitor-read.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpPingEventModule } from '../events/http-ping-event.module';
import { HttpPingReadModule } from '../read/http-ping-read.module';
import { HttpPingPingerModule } from '../pinger/http-ping-pinger.module';
import { HttpPingPushModule } from '../push/http-ping-push.module';
import { HttpPingTtlModule } from '../ttl/http-ping-ttl.module';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import { HttpPingCoreController } from './http-ping-core.controller';

@Module({
  imports: [
    HttpModule,
    HttpPingPingerModule,
    HttpPingPushModule,
    HttpPingTtlModule,
    HttpPingWriteModule,
    HttpPingReadModule,
    HttpMonitorReadModule,
    HttpPingEventModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [HttpPingCoreController],
})
export class HttpPingCoreModule {}
