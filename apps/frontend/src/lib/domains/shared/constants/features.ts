import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
import { Feature } from '$lib/domains/shared/types';

export const FEATURES = [
  {
    id: Feature.LOGGING,
    slug: 'logging',
    title: 'Application error logs',
    icon: LogsIcon,
    description:
      'One stream for every service, so the moment an error shows up you can read the request that caused it instead of guessing.',
    benefits: [
      'One error stream across every service',
      'Search from the alert back to the request that broke',
      'Tag every log with user, release and request',
    ],
    available: true,
  },
  {
    id: Feature.METRICS,
    slug: 'metrics',
    title: 'Response time and metrics',
    icon: MetricsIcon,
    description:
      'Response time on every check, plus your own counters and gauges. Watch the number that tells you a slowdown is coming.',
    benefits: [
      'Response time recorded on every HTTP check',
      'Your own counters and gauges from six SDKs',
      'Charts that show the slowdown before the outage',
    ],
    available: true,
  },
  {
    id: Feature.MONITORING,
    slug: 'monitoring',
    title: 'Uptime monitoring',
    icon: MonitoringIcon,
    description:
      'HTTP checks and cron heartbeats on the interval you pick. When one fails, Telegram tells you before your users do.',
    benefits: [
      'HTTP checks on status code and response time',
      'Heartbeats for cron jobs and background workers',
      'Telegram and webhook alerts, plus a public status page',
    ],
    available: true,
  },
] as const;
