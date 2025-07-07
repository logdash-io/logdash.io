import { ChartSplineIcon, HeartPulseIcon, LogsIcon } from 'lucide-svelte';
import { Feature } from '$lib/domains/shared/types';

export const FEATURES = [
  {
    id: Feature.LOGGING,
    title: 'Logging',
    icon: LogsIcon,
    description:
      'Capture every detail with our advanced logging system. Track application events, errors, and user actions in real-time with structured data that makes debugging and analysis simple.',
    benefits: [
      'Centralized log management with powerful search capabilities',
      'Structured logging with contextual information for faster troubleshooting',
      'Seamless integration with existing development workflows',
    ],
    available: true,
  },
  {
    id: Feature.METRICS,
    title: 'Metrics',
    icon: ChartSplineIcon,
    description:
      'Transform raw numbers into actionable business intelligence. Turn your application data into clear visualizations that reveal performance trends and potential optimizations at a glance.',
    benefits: [
      'Gain immediate visibility into critical system performance indicators',
      'Make data-driven decisions with confidence using real-time insights',
      'Translate technical metrics into business KPIs',
    ],
    available: true,
  },
  {
    id: Feature.MONITORING,
    title: 'Monitoring',
    icon: HeartPulseIcon,
    description:
      'Stay ahead of issues with intelligent monitoring. Set up alerts, create custom thresholds, and receive notifications across your preferred channels when something needs your attention.',
    benefits: [
      'Intelligent alerting with customizable thresholds and conditions',
      'Uptime monitoring and SLA tracking for critical services',
      'Telegram and email notifications for immediate incident response',
    ],
    available: true,
  },
];
