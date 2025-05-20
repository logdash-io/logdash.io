import { Module } from '@nestjs/common';
import { AddTestLogController } from './add-test-log.controller';
import { AddTestLogRateLimitService } from './add-test-log-rate-limit.service';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { LogQueueingModule } from '../queueing/log-queuing.module';

@Module({
  imports: [ClusterReadModule, ProjectReadModule, LogQueueingModule],
  controllers: [AddTestLogController],
  providers: [AddTestLogRateLimitService],
})
export class AddTestLogModule {}
