import { goto } from '$app/navigation';

interface WindowWithPostHog extends Window {
  posthog?: {
    capture: (event: string, properties?: Record<string, unknown>) => void;
  };
}

export type UpgradeSource =
  | 'nav-menu'
  | 'pricing-page'
  | 'notification-channel-setup'
  | 'metrics-limit'
  | 'cluster-limit'
  | 'project-limit'
  | 'public-dashboard-limit'
  | 'feature-restriction'
  | 'unknown';

export const startTierUpgrade = (source: UpgradeSource = 'unknown') => {
  // Track upgrade initiation with PostHog
  try {
    if (typeof window !== 'undefined') {
      const windowWithPostHog = window as WindowWithPostHog;
      if (windowWithPostHog.posthog) {
        windowWithPostHog.posthog.capture('upgrade_initiated', {
          source,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.warn('Failed to track upgrade event:', error);
  }

  const params = new URLSearchParams({ source });
  goto(`/app/api/user/upgrade?${params.toString()}`);
};
