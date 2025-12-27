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
    id: 'uptime-kuma',
    slug: 'uptime-kuma',
    competitorName: 'Uptime Kuma',
    title: 'vs Uptime Kuma',
    description:
      'Compare Logdash with Uptime Kuma - see the differences in features, ease of use, and monitoring capabilities.',
  },
  {
    id: 'uptime-robot',
    slug: 'uptime-robot',
    competitorName: 'Uptime Robot',
    title: 'vs Uptime Robot',
    description:
      'Compare Logdash with Uptime Robot - discover which monitoring solution fits your SaaS needs better.',
  },
  {
    id: 'datadog',
    slug: 'datadog',
    competitorName: 'Datadog',
    title: 'vs Datadog',
    description:
      'Logdash vs Datadog - understand the key differences between enterprise observability and founder-focused monitoring.',
  },
  {
    id: 'grafana',
    slug: 'grafana',
    competitorName: 'Grafana',
    title: 'vs Grafana',
    description:
      'Compare Logdash with Grafana - see why founders choose simplicity over complexity for app monitoring.',
  },
  {
    id: 'better-stack',
    slug: 'better-stack',
    competitorName: 'Better Stack',
    title: 'vs Better Stack',
    description:
      'Logdash vs Better Stack - compare features, pricing, and ease of use for modern monitoring.',
  },
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
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Status Pages',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Downtime alerts',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Server Logs',
    logdash: '',
    competitor: '',
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
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Generous free plan',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
];

export const uptimeKumaComparisonData: ComparisonPoint[] = [
  {
    feature: 'Best For',
    logdash: 'SaaS Founders (business minded)',
    competitor: 'Self-hosters & DevOps teams',
  },
  {
    feature: 'Deployment',
    logdash: 'Fully managed SaaS',
    competitor: 'Self-hosted only',
    logdashWin: true,
  },
  {
    feature: 'Setup Time',
    logdash: '2 minutes',
    competitor: '30+ minutes (+ server maintenance)',
    logdashWin: true,
  },
  {
    feature: 'Maintenance Required',
    logdash: 'Zero',
    competitor: 'Regular updates & server management',
    logdashWin: true,
  },
  {
    feature: 'Learning Curve',
    logdash: 'Lower',
    competitor: 'Higher',
    logdashWin: true,
  },
  {
    feature: 'Built-in Logs & Metrics',
    logdash: 'Yes',
    competitor: 'No (monitoring only)',
    logdashWin: true,
  },
];

export const uptimeKumaFeatureComparisonData: ComparisonPoint[] = [
  {
    feature: 'Uptime Monitoring',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Status Pages',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Server Logs',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Performance Metrics',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Zero Maintenance',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Discord/Telegram Alerts',
    logdash: 'Native Integration',
    competitor: 'Via webhooks/notifications',
    logdashWin: true,
  },
  {
    feature: 'Hosted Solution',
    logdash: 'Fully managed',
    competitor: 'Self-host required',
    logdashWin: true,
  },
];

export const uptimeRobotComparisonData: ComparisonPoint[] = [
  {
    feature: 'Best For',
    logdash: 'SaaS Founders (modern stack)',
    competitor: 'Simple uptime checks',
  },
  {
    feature: 'Monitoring Depth',
    logdash: 'Full-stack observability',
    competitor: 'Basic uptime only',
    logdashWin: true,
  },
  {
    feature: 'Server Logs',
    logdash: 'Built-in',
    competitor: 'Not available',
    logdashWin: true,
  },
  {
    feature: 'Custom Metrics',
    logdash: 'Full support',
    competitor: 'Limited',
    logdashWin: true,
  },
  {
    feature: 'Modern UX',
    logdash: 'Clean & intuitive',
    competitor: 'Dated interface',
    logdashWin: true,
  },
  {
    feature: 'Check Interval (Free)',
    logdash: '60 seconds',
    competitor: '5 minutes',
    logdashWin: true,
  },
];

export const uptimeRobotFeatureComparisonData: ComparisonPoint[] = [
  {
    feature: 'Uptime Monitoring',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Status Pages',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Server Logs',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Performance Metrics',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Error Tracking',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Modern UI/UX',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Fast Check Intervals',
    logdash: '60s on free plan',
    competitor: '5 min on free plan',
    logdashWin: true,
  },
];

export const datadogComparisonData: ComparisonPoint[] = [
  {
    feature: 'Best For',
    logdash: 'SaaS Founders',
    competitor: 'Enterprise teams',
  },
  {
    feature: 'Pricing Model',
    logdash: 'Predictable & transparent',
    competitor: 'Complex & expensive',
    logdashWin: true,
  },
  {
    feature: 'Setup Complexity',
    logdash: 'Minutes',
    competitor: 'Days to weeks',
    logdashWin: true,
  },
  {
    feature: 'Learning Curve',
    logdash: 'Gentle',
    competitor: 'Steep',
    logdashWin: true,
  },
  {
    feature: 'Feature Scope',
    logdash: 'Focused & purposeful',
    competitor: 'Everything under the sun',
    logdashWin: false,
  },
  {
    feature: 'Monthly Cost (typical)',
    logdash: '$0-15',
    competitor: '$2,000-20,000+',
    logdashWin: true,
  },
];

export const datadogFeatureComparisonData: ComparisonPoint[] = [
  {
    feature: 'Uptime Monitoring',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Status Pages',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Server Logs',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Performance Metrics',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Simple Pricing',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Quick Setup',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'APM & Tracing',
    logdash: '',
    competitor: '',
    logdashWin: false,
  },
];

export const grafanaComparisonData: ComparisonPoint[] = [
  {
    feature: 'Best For',
    logdash: 'SaaS Founders',
    competitor: 'DevOps Engineers',
  },
  {
    feature: 'Setup Required',
    logdash: 'Zero configuration',
    competitor: 'Heavy configuration',
    logdashWin: true,
  },
  {
    feature: 'Data Sources',
    logdash: 'Built-in (ready to go)',
    competitor: 'DIY everything',
    logdashWin: true,
  },
  {
    feature: 'Dashboard Creation',
    logdash: 'Pre-built & intuitive',
    competitor: 'Manual & complex',
    logdashWin: true,
  },
  {
    feature: 'Learning Curve',
    logdash: 'Minimal',
    competitor: 'Significant',
    logdashWin: true,
  },
  {
    feature: 'Customization',
    logdash: 'Opinionated simplicity',
    competitor: 'Infinite flexibility',
    logdashWin: false,
  },
];

export const grafanaFeatureComparisonData: ComparisonPoint[] = [
  {
    feature: 'Uptime Monitoring',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Status Pages',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Server Logs',
    logdash: 'Built-in',
    competitor: 'Via Loki setup',
    logdashWin: true,
  },
  {
    feature: 'Performance Metrics',
    logdash: 'Built-in',
    competitor: 'Via Prometheus setup',
    logdashWin: true,
  },
  {
    feature: 'Zero Configuration',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Alerts',
    logdash: 'Native Discord/Telegram',
    competitor: 'Complex alerting rules',
    logdashWin: true,
  },
  {
    feature: 'Custom Dashboards',
    logdash: 'Limited',
    competitor: 'Unlimited',
    logdashWin: false,
  },
];

export const betterStackComparisonData: ComparisonPoint[] = [
  {
    feature: 'Best For',
    logdash: 'SaaS Founders',
    competitor: 'Growing startups',
  },
  {
    feature: 'Pricing Transparency',
    logdash: 'Clear & predictable',
    competitor: 'Usage-based complexity',
    logdashWin: true,
  },
  {
    feature: 'Status Pages',
    logdash: 'Included',
    competitor: 'Separate product',
    logdashWin: true,
  },
  {
    feature: 'Learning Curve',
    logdash: 'Lower',
    competitor: 'Moderate',
    logdashWin: true,
  },
  {
    feature: 'Feature Integration',
    logdash: 'Unified experience',
    competitor: 'Multiple products',
    logdashWin: true,
  },
  {
    feature: 'Product Maturity',
    logdash: 'Focused & evolving',
    competitor: 'Established & broader',
    logdashWin: 'both',
  },
];

export const betterStackFeatureComparisonData: ComparisonPoint[] = [
  {
    feature: 'Uptime Monitoring',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Status Pages',
    logdash: 'Included',
    competitor: 'Separate pricing',
    logdashWin: true,
  },
  {
    feature: 'Server Logs',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Performance Metrics',
    logdash: '',
    competitor: '',
    logdashWin: 'both',
  },
  {
    feature: 'Simple Pricing',
    logdash: '',
    competitor: '',
    logdashWin: true,
  },
  {
    feature: 'Unified Product',
    logdash: 'Single integrated tool',
    competitor: 'Multiple separate tools',
    logdashWin: true,
  },
  {
    feature: 'Incident Management',
    logdash: 'Basic',
    competitor: 'Advanced',
    logdashWin: false,
  },
];
