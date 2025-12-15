import { ChartSplineIcon, HeartPulseIcon, LogsIcon } from 'lucide-svelte';
import { Feature } from '$lib/domains/shared/types';

export const FEATURES = [
  {
    id: Feature.LOGGING,
    slug: 'logging',
    title: 'Logging',
    icon: LogsIcon,
    description:
      'See what happened, with context. Search and filter logs fast so you can fix issues without guessing.',
    benefits: [
      'One place for logs across all sources',
      'Find the error behind a support ticket fast',
      'Add context (user, release, request) to every log',
    ],
    available: true,
  },
  {
    id: Feature.METRICS,
    slug: 'metrics',
    title: 'Metrics',
    icon: ChartSplineIcon,
    description:
      'Track the numbers that matter and spot trends early, from latency to signups, without a complicated setup.',
    benefits: [
      'Performance and business KPIs',
      'Catch regressions before customers churn',
      'Crystal-clear charts with real-time insights',
    ],
    available: true,
  },
  {
    id: Feature.MONITORING,
    slug: 'monitoring',
    title: 'Monitoring',
    icon: HeartPulseIcon,
    description:
      'Know when your app is down, and get alerted before it turns into a support thread.',
    benefits: [
      'Uptime checks with clear alerts',
      'Reliability tracking with uptime history',
      'Telegram and email notifications for immediate incident response',
    ],
    available: true,
  },
];
