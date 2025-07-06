export enum UserTier {
  // free
  Free = 'free',
  EarlyUser = 'early-user',

  // paid
  EarlyBird = 'early-bird',
  Builder = 'builder',
  Pro = 'pro',

  // special
  Contributor = 'contributor',
  Admin = 'admin',
}

export const purchasableTiers = [UserTier.Builder, UserTier.Pro];
export const paidTiers = [UserTier.EarlyBird, UserTier.Builder, UserTier.Pro];
