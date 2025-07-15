import { goto } from '$app/navigation';
import { UserTier } from '../types.js';

export type UpgradeSource =
  | 'nav-menu'
  | 'pricing-page'
  | 'notification-channel-setup'
  | 'metrics-limit'
  | 'cluster-limit'
  | 'project-limit'
  | 'public-dashboard-limit'
  | 'webhook-method-restriction'
  | 'webhook-headers-restriction'
  | 'cluster-invite-limit'
  | 'logs-filter-dropdown'
  | 'logs-date-range'
  | 'monitor-historical-uptime'
  | 'custom-statuspage-domain'
  | 'unknown';

export const startTierUpgrade = (
  source: UpgradeSource = 'unknown',
  tier: UserTier = UserTier.BUILDER,
) => {
  const params = new URLSearchParams({ source, tier: tier.toString() });
  goto(`/app/api/user/upgrade?${params.toString()}`);
};
