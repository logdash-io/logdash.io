import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SubscriptionWriteService } from '../write/subscription-write.service';
import { SubscriptionReadService } from '../read/subscription-read.service';
import { paidTiers, UserTier } from '../../user/core/enum/user-tier.enum';
import { UserTierService } from '../../user/tier/user-tier.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { SUBSCRIPTIONS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { ApplyNewSubscriptionDto } from './dto/try-apply-new-subscription.dto';
import { ChangeActiveSubscriptionEndsAtDto } from './dto/change-active-subscrription-ends-at.dto';
import { subSeconds } from 'date-fns';

@Injectable()
export class SubscriptionManagementService {
  constructor(
    private readonly subscriptionReadService: SubscriptionReadService,
    private readonly subscriptionWriteService: SubscriptionWriteService,
    private readonly userTierService: UserTierService,
    @Inject(SUBSCRIPTIONS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  public async syncUserTier(userId: string): Promise<void> {
    const activeSubscription = await this.subscriptionReadService.readActiveByUserId(userId);

    if (!activeSubscription) {
      await this.userTierService.updateUserTier(userId, UserTier.Free);
      this.logger.log('Synced user tier to Free (no active subscription)', { userId });
    }

    if (activeSubscription) {
      await this.userTierService.updateUserTier(userId, activeSubscription.tier);
      this.logger.log('Synced user tier to active subscription tier', {
        userId,
        tier: activeSubscription.tier,
      });
    }
  }

  public async applyNew(dto: ApplyNewSubscriptionDto): Promise<void> {
    const activeSubscription = await this.subscriptionReadService.readActiveByUserId(dto.userId);

    if (activeSubscription) {
      this.logger.log(
        'Tried to apply new subscription to user but user already has active subscription',
        {
          dto,
          activeSubscription,
        },
      );

      throw new BadRequestException('User already has active subscription');
    }

    await this.subscriptionWriteService.create({
      startedAt: new Date(),
      tier: dto.tier,
      userId: dto.userId,
      endsAt: dto.endsAt,
    });

    await this.userTierService.updateUserTier(dto.userId, dto.tier);

    this.logger.log('Applied new subscription successfully', {
      userId: dto.userId,
      tier: dto.tier,
      endsAt: dto.endsAt,
    });
  }

  public async changeActiveSubscriptionExpirationDate(
    dto: ChangeActiveSubscriptionEndsAtDto,
  ): Promise<void> {
    const activeSubscription = await this.subscriptionReadService.readActiveByUserId(dto.userId);

    if (!activeSubscription) {
      this.logger.log('Cannot change expiration date of non-existing subscription', {
        dto,
      });

      throw new BadRequestException('User does not have active subscription');
    }

    if (paidTiers.includes(activeSubscription.tier)) {
      this.logger.log('Cannot change expiration date of paid subscription', {
        dto,
      });

      throw new BadRequestException('Cannot change expiration date of paid subscription');
    }

    await this.subscriptionWriteService.updateOne({
      id: activeSubscription.id,
      endsAt: dto.endsAt,
    });
  }

  public async endActiveNonPaidSubscription(userId: string): Promise<void> {
    const activeSubscription = await this.subscriptionReadService.readActiveByUserId(userId);

    if (!activeSubscription) {
      this.logger.log('Cannot end non-existing subscription', {
        userId,
      });

      throw new BadRequestException('User does not have active subscription');
    }

    if (activeSubscription?.tier === UserTier.EarlyBird) {
      this.logger.log('Cannot end early bird subscription', {
        userId,
      });

      throw new BadRequestException('Cannot end early bird subscription');
    }

    await this.subscriptionWriteService.updateOne({
      id: activeSubscription.id,
      endsAt: subSeconds(new Date(), 1),
    });

    await this.syncUserTier(userId);
  }

  public async endActiveSubscription(userId: string, stripeCustomerId: string): Promise<void> {
    const activeSubscription = await this.subscriptionReadService.readActiveByUserId(userId);

    if (!activeSubscription) {
      this.logger.log('Cannot end non-existing subscription', {
        userId,
        stripeCustomerId,
      });

      throw new BadRequestException('User does not have active subscription');
    }

    await this.subscriptionWriteService.updateOne({
      id: activeSubscription.id,
      endsAt: subSeconds(new Date(), 1),
    });

    await this.syncUserTier(userId);

    this.logger.log('Ended active subscription successfully', {
      userId,
      stripeCustomerId,
      subscriptionId: activeSubscription.id,
    });
  }

  public async changePaidPlan(
    userId: string,
    stripeCustomerId: string,
    tier: UserTier,
  ): Promise<void> {
    const activeSubscription = await this.subscriptionReadService.readActiveByUserId(userId);

    if (!activeSubscription) {
      this.logger.log('Cannot upgrade non-existing subscription', { userId });
      throw new BadRequestException('User does not have active subscription');
    }

    if (activeSubscription.tier === tier) {
      this.logger.log('Cannot upgrade to same tier', { userId, tier });
      throw new BadRequestException('Cannot upgrade to same tier');
    }

    if (!paidTiers.includes(activeSubscription.tier)) {
      this.logger.log('Cannot upgrade non-paid subscription', { userId, tier });
      throw new BadRequestException('Cannot upgrade non-paid subscription');
    }

    await this.endActiveSubscription(userId, stripeCustomerId);

    await this.applyNew({
      userId,
      tier,
      endsAt: null,
    });

    this.logger.log('Changed paid plan successfully', {
      userId,
      stripeCustomerId,
      newTier: tier,
      previousTier: activeSubscription.tier,
    });
  }
}
