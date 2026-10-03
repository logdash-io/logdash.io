export const FEATURES = [
  {
    slug: 'monitoring',
    title: 'Uptime monitoring',
    description:
      'HTTP checks as often as every 15 seconds. When one fails, Telegram tells you before your users do.',
  },
  {
    slug: 'logging',
    title: 'Error logs',
    description:
      'Errors from every service in one live stream. Search it to find why the app went down.',
  },
  {
    slug: 'metrics',
    title: 'Response time and metrics',
    description:
      'Response time on every uptime check, plus any number from your code on a live chart.',
  },
] as const;
