import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SubscriptionReadService } from '../read/subscription-read.service';
import { SubscriptionEntity } from './entities/subscription.entity';

@Controller('subscriptions')
export class SubscriptionCoreController {
  constructor(private readonly subscriptionReadService: SubscriptionReadService) {}

  @Get('user/:userId/active')
  public async getActiveSubscriptionByUserId(
    @Param('userId') userId: string,
  ): Promise<SubscriptionEntity | null> {
    return this.subscriptionReadService.readActiveByUserId(userId);
  }
}
