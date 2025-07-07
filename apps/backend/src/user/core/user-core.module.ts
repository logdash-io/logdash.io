import { Module } from '@nestjs/common';
import { UserCoreController } from './user-core.controller';
import { UserReadModule } from '../read/user-read.module';
import { UserCoreEventController } from './user-core.event-controller';
import { UserWriteModule } from '../write/user-write.module';
import { UserEventModule } from '../events/user-event.module';
import { UserTtlModule } from '../ttl/user-ttl.module';
import { CustomJwtModule } from '../../auth/custom-jwt/custom-jwt.module';
import { ClusterWriteModule } from '../../cluster/write/cluster-write.module';
import { UserCoreService } from './user-core.service';

@Module({
  imports: [
    UserReadModule,
    UserWriteModule,
    UserEventModule,
    UserTtlModule,
    CustomJwtModule,
    ClusterWriteModule,
  ],
  providers: [UserCoreEventController, UserCoreService],
  controllers: [UserCoreController],
})
export class UserCoreModule {}
