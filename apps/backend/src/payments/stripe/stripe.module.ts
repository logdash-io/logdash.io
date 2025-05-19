import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UserWriteModule } from '../../user/write/user-write.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { UserTierModule } from '../../user/tier/user-tier.module';

@Module({
  imports: [UserWriteModule, UserReadModule, UserTierModule],
  providers: [StripeService],
  controllers: [StripeController],
})
export class StripeModule {}
