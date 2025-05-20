import { Module } from '@nestjs/common';
import { UserTierService } from './user-tier.service';
import { UserWriteModule } from '../write/user-write.module';

@Module({
  imports: [UserWriteModule],
  providers: [UserTierService],
  exports: [UserTierService],
})
export class UserTierModule {}
