import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscriptionManagementService } from '../management/subscription-management.service';
import { addDays } from 'date-fns';

@ApiTags('Subscriptions')
@Controller('')
export class SubscriptionCoreController {
  constructor(private readonly subscriptionManagementService: SubscriptionManagementService) {}

  @Get('admin/user/:userId/extend_active_subscription')
  public async getActiveSubscriptionByUserId(@Param('userId') userId: string): Promise<void> {
    await this.subscriptionManagementService.changeActiveSubscriptionExpirationDate({
      userId,
      endsAt: addDays(new Date(), 1),
    });
  }
}
