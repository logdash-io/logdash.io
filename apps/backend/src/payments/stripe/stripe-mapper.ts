import { getEnvConfig } from '../../shared/configs/env-configs';
import { UserTier } from '../../user/core/enum/user-tier.enum';

export function mapTierToPriceId(tier: UserTier): string {
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
