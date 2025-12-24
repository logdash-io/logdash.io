import { UserTier } from '../types.js';

export type UpgradeSource =
  | 'nav-menu'
  | 'pricing-page'
  | 'notification-channel-setup'
  | 'metrics-limit'
  | 'cluster-limit'
  | 'project-limit'
  | 'public-dashboard-limit'
  | 'status-page-limit'
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
): void => {
  const params = new URLSearchParams({ source, tier: tier.toString() });
  window.location.href = `/app/api/user/upgrade?${params.toString()}`;
};
