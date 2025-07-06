import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { UserReadService } from '../../user/read/user-read.service';
import { AccountClaimStatus } from '../../user/core/enum/account-claim-status.enum';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Injectable()
export class StripeCheckoutService {
  constructor(
    private readonly stripe: Stripe,
    private readonly logger: Logger,
    private readonly userReadService: UserReadService,
  ) {}

  private mapTierToPriceId(tier: UserTier): string {
    switch (tier) {
      case UserTier.EarlyBird:
        return getEnvConfig().stripe.earlyBirdPriceId;
      case UserTier.Builder:
        return getEnvConfig().stripe.builderPriceId;
      case UserTier.Pro:
        return getEnvConfig().stripe.proPriceId;
      default:
        throw new Error(`Invalid tier: ${tier}`);
    }
  }

  public async getCheckoutUrl(dto: {
    userId: string;
    tier: UserTier;
    isTrial: boolean;
  }): Promise<string> {
    this.logger.log(`[STRIPE] Initiating checkout for user`, {
      userId: dto.userId,
      tier: dto.tier,
      isTrial: dto.isTrial,
    });

    const user = await this.userReadService.readByIdOrThrow(dto.userId);

    if (!user) {
      this.logger.error(`[STRIPE] User not found while trying to initiate stripe checkout.`, {
        userId: dto.userId,
      });
      throw new Error(`User not found while trying to initiate stripe checkout`);
    }

    if (user.accountClaimStatus !== AccountClaimStatus.Claimed) {
      this.logger.error(
        `[STRIPE] User account not claimed while trying to initiate stripe checkout`,
        {
          userId: dto.userId,
        },
      );
      throw new Error(`User account not claimed while trying to initiate stripe checkout`);
    }

    const checkoutSession = await this.stripe.checkout.sessions.create({
      customer_email: user.email,
      success_url: getEnvConfig().stripe.successUrl,
      mode: 'subscription',
      line_items: [
        {
          price: this.mapTierToPriceId(dto.tier),
          quantity: 1,
        },
      ],
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required',
      subscription_data: {
        trial_period_days: dto.isTrial ? 30 : undefined,
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
      },
    });

    if (!checkoutSession.url) {
      this.logger.error(`[STRIPE] Checkout session contained no information for user`, {
        userId: dto.userId,
      });

      throw new Error(`Failed to process payment for user: ${user.email}`);
    }

    return checkoutSession.url;
  }
}
