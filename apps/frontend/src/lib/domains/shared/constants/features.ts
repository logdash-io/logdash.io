export const FEATURES = [
  {
    slug: 'logging',
    title: 'Log management',
    description:
      'Logs from every service in one live stream. Search and filter them to find the line that broke it.',
  },
  {
    slug: 'metrics',
    title: 'Custom metrics',
    description:
      'Sign-ups, payments, queue depth. Send any number with one line of code and watch it on a live chart.',
  },
  {
    slug: 'monitoring',
    title: 'Uptime monitoring',
    description:
      'HTTP checks as often as every 15 seconds. When one fails, Telegram tells you before your users do.',
  },
] as const;
