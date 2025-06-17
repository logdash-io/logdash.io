import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscriptionManagementService } from '../management/subscription-management.service';
import { AdminGuard } from '../../auth/core/guards/admin.guard';
import { ExtendActiveSubscriptionBody } from './dto/extend-active-subscription.body';
import { ApplyNewSubscriptionBody } from './dto/apply-new-subscription.body';
import { Public } from '../../auth/core/decorators/is-public';

@ApiTags('Subscriptions')
@UseGuards(AdminGuard)
@Controller('')
export class SubscriptionCoreController {
  constructor(private readonly subscriptionManagementService: SubscriptionManagementService) {}

  @Public()
  @Post('admin/user/:userId/apply_new_subscription')
  public async applyNewSubscription(
    @Param('userId') userId: string,
    @Body() body: ApplyNewSubscriptionBody,
  ): Promise<void> {
    await this.subscriptionManagementService.applyNew({
      userId,
      tier: body.tier,
      endsAt: new Date(body.endsAt),
    });
  }

  @Public()
  @Post('admin/user/:userId/extend_active_subscription')
  public async getActiveSubscriptionByUserId(
    @Param('userId') userId: string,
    @Body() body: ExtendActiveSubscriptionBody,
  ): Promise<void> {
    await this.subscriptionManagementService.changeActiveSubscriptionExpirationDate({
      userId,
      endsAt: new Date(body.endsAt),
    });
  }

  @Public()
  @Post('admin/user/:userId/end_active_subscription')
  @UseGuards(AdminGuard)
  public async endActiveSubscription(@Param('userId') userId: string): Promise<void> {
    await this.subscriptionManagementService.endActiveNonPaidSubscription(userId);
  }
}
