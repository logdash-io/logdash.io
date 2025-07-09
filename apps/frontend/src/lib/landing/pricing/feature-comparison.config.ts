import { UserTier } from '$lib/domains/shared/types.js';

export const FEATURES_COMPARISON = {
  title: 'Compare Plans',
  plans: [
    { name: 'Hobby', price: 'Free', tier: UserTier.FREE },
    { name: 'Builder', price: '9$/month', tier: UserTier.BUILDER },
    { name: 'Pro', price: '$29/month', tier: UserTier.PRO },
  ],
  sections: [
    {
      name: 'Projects',
      icon: '🚀',
      features: [
        {
          name: 'Projects',
          [UserTier.FREE]: 'Unlimited',
          [UserTier.BUILDER]: 'Unlimited',
          [UserTier.PRO]: 'Unlimited',
        },
        {
          name: 'Services',
          [UserTier.FREE]: '5',
          [UserTier.BUILDER]: '20',
          [UserTier.PRO]: '50',
        },
      ],
    },
    {
      name: 'Logs',
      icon: '📊',
      features: [
        {
          name: 'Logs retention',
          [UserTier.FREE]: '24 hours (240k logs per service)',
          [UserTier.BUILDER]: '7 days (4.2M logs per service)',
          [UserTier.PRO]: '30 days (37M logs per service)',
        },
        {
          name: 'Rate limit per hour',
          [UserTier.FREE]: '10,000',
          [UserTier.BUILDER]: '25,000',
          [UserTier.PRO]: '50,000',
        },
      ],
    },
    {
      name: 'Metrics',
      icon: '📈',
      features: [
        {
          name: 'Metrics per service',
          [UserTier.FREE]: '5',
          [UserTier.BUILDER]: '10',
          [UserTier.PRO]: '30',
        },
        {
          name: 'Metrics retention',
          [UserTier.FREE]: '24 hours',
          [UserTier.BUILDER]: '7 days',
          [UserTier.PRO]: '30 days',
        },
      ],
    },
    {
      name: 'Dashboards',
      icon: '📊',
      features: [
        {
          name: 'Public dashboards',
          [UserTier.FREE]: '1',
          [UserTier.BUILDER]: '5',
          [UserTier.PRO]: '15',
        },
      ],
    },
    {
      name: 'Monitors',
      icon: '🔍',
      features: [
        {
          name: 'Number of monitors per service',
          [UserTier.FREE]: '1 (5 in total)',
          [UserTier.BUILDER]: '1 (20 in total)',
          [UserTier.PRO]: '1 (50 in total)',
        },
        {
          name: 'Monitors ping frequency',
          [UserTier.FREE]: '5min',
          [UserTier.BUILDER]: '1min',
          [UserTier.PRO]: '15s',
        },
        {
          name: 'Historical uptime charts',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
      ],
    },
    {
      name: 'Alerting',
      icon: '🚨',
      features: [
        {
          name: 'Telegram alerts',
          [UserTier.FREE]: true,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Webhook alerts',
          [UserTier.FREE]: true,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Email alerts',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: 'Coming soon',
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'Discord alerts',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: 'Coming soon',
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'Slack alerts',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: 'Coming soon',
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'SMS alerts',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: 'Coming soon',
          [UserTier.PRO]: 'Coming soon',
        },
      ],
    },
    {
      name: 'Support',
      icon: '💬',
      features: [
        {
          name: 'Dedicated discord channel',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Priority support',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Regular catch-up calls',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Early access to new features',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Feature requests',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
      ],
    },
    {
      name: 'Professional',
      icon: '⚡',
      features: [
        {
          name: 'Multiple Collaborators',
          [UserTier.FREE]: '1 extra user per project',
          [UserTier.BUILDER]: '2 extra users per project',
          [UserTier.PRO]: '3 extra users per project',
        },
        {
          name: '99.9% uptime SLA',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: false,
          [UserTier.PRO]: true,
        },
        {
          name: 'Team management features',
          [UserTier.FREE]: true,
          [UserTier.BUILDER]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Custom branding options',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: false,
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'Custom status page domain',
          [UserTier.FREE]: false,
          [UserTier.BUILDER]: false,
          [UserTier.PRO]: 'Coming soon',
        },
      ],
    },
  ],
};
