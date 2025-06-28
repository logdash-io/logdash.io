import { UserTier } from '$lib/shared/types.js';

export const featureComparison = {
  title: 'Compare Plans',
  plans: [
    { name: 'Hobby', price: 'Free', tier: UserTier.FREE },
    { name: 'Early Bird', price: '5$/month', tier: UserTier.EARLY_BIRD },
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
          [UserTier.EARLY_BIRD]: 'Unlimited',
          [UserTier.PRO]: 'Unlimited',
        },
        {
          name: 'Services',
          [UserTier.FREE]: '5',
          [UserTier.EARLY_BIRD]: '20',
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
          [UserTier.FREE]: '7 days (350K logs per service)',
          [UserTier.EARLY_BIRD]: '30 days (7.5M logs per service)',
          [UserTier.PRO]: '3 months (90M logs per service)',
        },
        {
          name: 'Rate limit per hour (burst protection)',
          [UserTier.FREE]: '10,000',
          [UserTier.EARLY_BIRD]: '50,000',
          [UserTier.PRO]: '200,000',
        },
        {
          name: 'Rate limit per day',
          [UserTier.FREE]: '50,000',
          [UserTier.EARLY_BIRD]: '250,000',
          [UserTier.PRO]: '1,000,000',
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
          [UserTier.EARLY_BIRD]: '10',
          [UserTier.PRO]: '30',
        },
        {
          name: 'Metrics retention',
          [UserTier.FREE]: '7 days',
          [UserTier.EARLY_BIRD]: '30 days',
          [UserTier.PRO]: '90 days',
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
          [UserTier.EARLY_BIRD]: '5',
          [UserTier.PRO]: '25',
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
          [UserTier.EARLY_BIRD]: '1 (20 in total)',
          [UserTier.PRO]: '1 (50 in total)',
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
          [UserTier.EARLY_BIRD]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Email alerts',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: 'Coming soon',
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'Webhook alerts',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Discord alerts',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: 'Coming soon',
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'Slack alerts',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: 'Coming soon',
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'SMS alerts',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: 'Coming soon',
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
          [UserTier.EARLY_BIRD]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Priority support',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Regular catch-up calls',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Early access to new features',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: true,
          [UserTier.PRO]: true,
        },
        {
          name: 'Feature requests',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: true,
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
          [UserTier.FREE]: 'Coming soon',
          [UserTier.EARLY_BIRD]: 'Coming soon',
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: '99.9% uptime SLA',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: false,
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'Team management features',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: false,
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'Custom branding options',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: false,
          [UserTier.PRO]: 'Coming soon',
        },
        {
          name: 'Custom status page domain',
          [UserTier.FREE]: false,
          [UserTier.EARLY_BIRD]: false,
          [UserTier.PRO]: 'Coming soon',
        },
      ],
    },
  ],
};
