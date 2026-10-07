import type { FeaturePageData } from './feature-page';

export const metricsPage: FeaturePageData = {
  slug: 'metrics',
  name: 'Response time and metrics',
  meta: {
    title: 'Response time monitoring and custom metrics | Logdash',
    description:
      'Response time on every uptime check, plus sign-ups, payments or queue depth from your code in one line. Live charts by minute, hour and day. 5 metrics free.',
    keywords:
      'response time monitoring, api response time monitoring, website response time, custom metrics, custom metrics dashboard, application metrics, track metrics in node.js',
  },
  h1: 'Response time and custom metrics.',
  h1Quiet: 'See the slowdown before the outage.',
  intro:
    'Every uptime check records how long your server took to answer. Add any number from your code, like queue depth or failed payments, with one line.',
  overview: {
    title: 'The number moves first.',
    quiet: 'The outage follows.',
    description:
      'Queue depth creeps up before the worker stalls. Failed payments pile up before anyone writes in. Send those numbers from your code and watch them move.',
  },
  capabilities: [
    {
      title: 'Response time on every check',
      body: 'Every HTTP check records how long your endpoint took to answer. No answer within 10\u00a0seconds counts as down and sends the alert.',
    },
    {
      title: 'One line per metric',
      body: 'Call setMetric or mutateMetric where the number changes. A new name shows up in your dashboard the first time you send it.',
    },
    {
      title: 'Counters and gauges',
      body: 'Set a gauge like active users to an exact value. Mutate a counter like sign-ups by any amount, up or down.',
    },
    {
      title: 'Live as it happens',
      body: 'Values stream into the dashboard while you watch. Each metric keeps its current value on a tile, with no refresh needed.',
    },
    {
      title: 'Minute, hour and day charts',
      body: 'Zoom from per-minute detail for the last hour to daily points. Your plan sets how far back you can look, up to 30 days.',
    },
    {
      title: 'Next to your logs',
      body: 'Metric tiles sit on the same screen as your logs, so a spike and the error behind it are side by side.',
    },
  ],
  steps: {
    title: 'Three steps to your first chart.',
    description:
      'No agent to run, no dashboard to build. Charts appear with the first value.',
    items: [
      {
        title: 'Add a service',
        body: 'Sign in with GitHub or Google and add a service. Each service gets its own API key and its own set of metrics.',
      },
      {
        title: 'Install the SDK',
        body: 'Install the SDK for your language and create the client with your API key. Or copy the setup prompt and let your AI assistant wire it in.',
      },
      {
        title: 'Send a number',
        body: 'Call setMetric or mutateMetric where the value changes. The metric gets its own tile and charts within seconds of the first value.',
      },
    ],
  },
  sdk: {
    title: 'Track metrics in Node.js.',
    body: 'Install @logdash/node, create the client with your API key, then set or mutate any metric in one line. Python, Go, .NET, Java, Rust, Ruby and PHP work the same way.',
    language: 'typescript',
    file: 'server.ts',
    code: `import { Logdash } from '@logdash/node';

const logdash = new Logdash(process.env.LOGDASH_API_KEY);

// to set absolute value
logdash.setMetric('users', 0);

// to modify existing metric
logdash.mutateMetric('users', 1);`,
  },
  faq: [
    {
      question: 'Can Logdash monitor API response time?',
      answer:
        'Yes. Every HTTP check records how long your endpoint took to answer, and no answer within 10 seconds counts as down. For timings inside your code, like a slow query, send the duration as a metric with setMetric.',
    },
    {
      question: 'How do I track custom metrics in my app?',
      answer:
        'Install the Logdash SDK for your language and create the client with your API key. Then call setMetric or mutateMetric in Node.js, or set and mutate on the metrics client in the other SDKs. The metric appears in your dashboard the first time a value arrives.',
    },
    {
      question: 'What is the difference between set and mutate?',
      answer:
        'Set replaces the current value, which suits gauges like active users or queue depth. Mutate adds a positive or negative amount to the current value, which suits counters like sign-ups or processed jobs.',
    },
    {
      question: 'Which languages are supported?',
      answer:
        'There are official SDKs for Node.js, Python, Go, .NET, Java, Rust, Ruby and PHP. Anything else can send a metric with a single HTTP PUT request and your API key.',
    },
    {
      question: 'How long is metric history kept?',
      answer:
        '24 hours on the free Hobby plan, 7 days on Builder and 30 days on Pro. Recent values are kept per minute, older ones per hour and per day.',
    },
    {
      question: 'How many metrics can I track?',
      answer:
        'Up to 5 metrics per service on Hobby, 10 on Builder and 30 on Pro. Past the limit, new metric names are not recorded while your existing metrics keep working. Delete one you no longer need to free its slot.',
    },
    {
      question: 'Is there a free plan?',
      answer:
        'Yes. Hobby is free and includes 5 metrics per service with 24 hours of history, plus logs and uptime monitoring. Builder is $9 a month and Pro is $15 a month.',
    },
    {
      question: 'Can I get an alert when a metric changes?',
      answer:
        'Not yet. Alerts cover uptime today: when a monitor goes down, or takes longer than 10 seconds to answer, Logdash tells you on Telegram or a webhook. Response times and metrics are for spotting the trend on the dashboard.',
    },
  ],
  related: [
    {
      title: 'Metrics docs',
      description: 'How metrics work and what each plan allows.',
      href: '/docs/metrics',
    },
    {
      title: 'Pricing',
      description: 'Free to start. Paid plans from $9 a month.',
      href: '/pricing',
    },
  ],
};
