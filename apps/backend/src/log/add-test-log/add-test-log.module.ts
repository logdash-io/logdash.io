import { Module } from '@nestjs/common';
import { AddTestLogController } from './add-test-log.controller';
import { AddTestLogRateLimitService } from './add-test-log-rate-limit.service';
import { LogQueueingModule } from '../queueing/log-queuing.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Module({
  imports: [LogQueueingModule, ...ClusterMemberGuardImports],
  controllers: [AddTestLogController],
  providers: [AddTestLogRateLimitService],
})
export class AddTestLogModule {}
