import { goto } from '$app/navigation';
import type { PostHog } from 'posthog-js';

export type UpgradeSource =
  | 'nav-menu'
  | 'pricing-page'
  | 'notification-channel-setup'
  | 'metrics-limit'
  | 'cluster-limit'
  | 'project-limit'
  | 'public-dashboard-limit'
  | 'feature-restriction'
  | 'webhook-method-restriction'
  | 'webhook-headers-restriction'
  | 'unknown';

export const startTierUpgrade = (
  posthog: PostHog,
  source: UpgradeSource = 'unknown',
) => {
  posthog.capture('upgrade_initiated', {
    source,
    timestamp: new Date().toISOString(),
  });

  const params = new URLSearchParams({ source });
  goto(`/app/api/user/upgrade?${params.toString()}`);
};
