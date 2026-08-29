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

export const startTierUpgrade = async (
  source: UpgradeSource = 'unknown',
  tier: UserTier = UserTier.BUILDER,
): Promise<void> => {
  const params = new URLSearchParams({ source, tier: tier.toString() });
  const response = await fetch(`/app/api/user/upgrade?${params.toString()}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Could not start the upgrade to ${tier}`);
  }

  const { checkoutUrl } = (await response.json()) as { checkoutUrl: string };

  window.location.href = checkoutUrl;
};
