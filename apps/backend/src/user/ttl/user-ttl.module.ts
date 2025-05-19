import { Module } from '@nestjs/common';
import { UserReadModule } from '../read/user-read.module';
import { UserTtlService } from './user-ttl.service';
import { UserWriteModule } from '../write/user-write.module';
import { ClusterRemovalModule } from '../../cluster/removal/cluster-removal.module';

@Module({
  imports: [UserReadModule, UserWriteModule, ClusterRemovalModule],
  providers: [UserTtlService],
})
export class UserTtlModule {}
