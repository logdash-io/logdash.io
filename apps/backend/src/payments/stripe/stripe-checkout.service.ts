import { Inject, Injectable } from '@nestjs/common';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { STRIPE_LOGGER } from '../../shared/logdash/logdash-tokens';
import Stripe from 'stripe';
import { UserReadService } from '../../user/read/user-read.service';
import { AccountClaimStatus } from '../../user/core/enum/account-claim-status.enum';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { mapTierToPriceId } from './stripe-mapper';

@Injectable()
export class StripeCheckoutService {
  constructor(
    private readonly stripe: Stripe,
    @Inject(STRIPE_LOGGER) private readonly logger: LogdashLogger,
    private readonly userReadService: UserReadService,
  ) {}

  public async getCheckoutUrl(dto: {
    userId: string;
    tier: UserTier;
    isTrial: boolean;
  }): Promise<string> {
    this.logger.log(`Initiating checkout for user`, {
      userId: dto.userId,
      tier: dto.tier,
      isTrial: dto.isTrial,
    });

    const user = await this.userReadService.readByIdOrThrow(dto.userId);

    if (!user) {
      this.logger.error(`User not found while trying to initiate stripe checkout.`, {
        userId: dto.userId,
      });
      throw new Error(`User not found while trying to initiate stripe checkout`);
    }

    if (user.accountClaimStatus !== AccountClaimStatus.Claimed) {
      this.logger.error(`User account not claimed while trying to initiate stripe checkout`, {
        userId: dto.userId,
      });
      throw new Error(`User account not claimed while trying to initiate stripe checkout`);
    }

    let checkoutSession: Stripe.Checkout.Session;

    try {
      checkoutSession = await this.stripe.checkout.sessions.create({
        customer_email: user.email,
        success_url: getEnvConfig().stripe.successUrl,
        mode: 'subscription',
        line_items: [
          {
            price: mapTierToPriceId(dto.tier),
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
    } catch (error) {
      this.logger.error(`Failed to create checkout session`, {
        userId: dto.userId,
        tier: dto.tier,
        error,
      });
      throw error;
    }

    if (!checkoutSession.url) {
      this.logger.error(`Checkout session contained no information for user`, {
        userId: dto.userId,
      });

      throw new Error(`Failed to process payment for user: ${user.email}`);
    }

    this.logger.log(`Checkout URL generated successfully`, {
      userId: dto.userId,
      tier: dto.tier,
      isTrial: dto.isTrial,
    });

    return checkoutSession.url;
  }
}
