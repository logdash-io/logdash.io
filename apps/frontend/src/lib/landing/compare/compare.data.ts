export interface Comparison {
  id: string;
  slug: string;
  competitorName: string;
  competitorLogo?: string;
  title: string;
  description: string;
}

export const comparisons: Comparison[] = [
  {
    id: 'posthog',
    slug: 'posthog',
    competitorName: 'PostHog',
    title: 'vs PostHog',
    description:
      'Understand the difference between Logdash (App Health) and PostHog (Product Analytics).',
  },
];

export interface ComparisonPoint {
  feature: string;
  logdash: string;
  competitor: string;
  logdashWin?: boolean | 'both';
}

export const posthogComparisonData: ComparisonPoint[] = [
  {
    feature: 'Best For',
    logdash: 'SaaS Founders (business minded)',
    competitor: 'Developers (technical minded)',
  },
  {
    feature: 'Complexity',
    logdash: 'Founders-native',
    competitor: 'Enterprise-grade',
  },
  {
    feature: 'Learning Curve',
    logdash: 'Lower',
    competitor: 'Higher',
    logdashWin: true,
  },
  {
    feature: 'Features set',
    logdash: 'Narrow & focused',
    competitor: 'Broad & complex',
    logdashWin: false,
  },
  {
    feature: 'Time To "Juice"',
    logdash: 'Lower',
    competitor: 'Higher',
    logdashWin: true,
  },
  {
    feature: 'Size of Juicebox',
    logdash: 'Compact',
    competitor: 'Enormous',
    logdashWin: false,
  },
];

export const featureComparisonData: ComparisonPoint[] = [
  {
    feature: 'Uptime Monitoring',
    logdash: 'Included',
    competitor: 'Not included',
    logdashWin: true,
  },
  {
    feature: 'Server Logs',
    logdash: 'Included',
    competitor: 'Included',
    logdashWin: 'both',
  },
  {
    feature: 'Discord/Telegram Alerts',
    logdash: 'Native Integration',
    competitor: 'Webhooks only',
    logdashWin: true,
  },
  {
    feature: 'Performance metrics',
    logdash: 'Included',
    competitor: 'Included',
    logdashWin: 'both',
  },
  {
    feature: 'Generous free plan',
    logdash: 'Included',
    competitor: 'Included',
    logdashWin: 'both',
  },
  {
    feature: 'Team management',
    logdash: 'Included',
    competitor: 'Included',
    logdashWin: 'both',
  },
];
