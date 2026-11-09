import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics/insights',
  title: 'Insights',
  description:
    'Funnels, trends, histograms and cohort tables that answer questions spanning weeks or months, saved as cards below the day.',
  keywords:
    'analytics funnels, cohort analysis, retention cohorts, event trends, product analytics insights',
  blocks: [
    {
      type: 'paragraph',
      text: 'Insights answer questions that span weeks or months. Add them with **Add insight** below the day. Everyone on the domain sees the same cards in the same order, and each card has its own period. Edit, move or remove a card from its menu.',
    },
    {
      type: 'callout',
      text: 'Your coding agent can build insights for you through the [MCP server](/docs/mcp), such as "add a funnel from first open to first merge, and a weekly cohort table".',
    },
    { type: 'heading', text: 'Funnel' },
    {
      type: 'paragraph',
      text: 'Counts how many events reached each step, in order, with the conversion and drop-off between steps. Each conversion shows its 95% interval, the range that likely holds the true rate.',
    },
    {
      type: 'list',
      items: [
        'Each step is an event with optional property filters. A filter for every step, such as `cohort` between two dates, keeps the steps comparable.',
        'Pick **People** instead to follow each visitor or signed-in user through pages and goals.',
        'Under **Chart**, pick **Columns** to draw a bar for each step with the drop between bars, or **Rows** to fit long step names in half the width.',
      ],
    },
    { type: 'heading', text: 'Trend' },
    {
      type: 'paragraph',
      text: 'Counts up to 5 events per day, week or month, each with its own filters, on one chart.',
    },
    { type: 'heading', text: 'Histogram' },
    {
      type: 'paragraph',
      text: 'Shows how often each value of a numeric property occurs, with its mean and median. Set the bar width to group values.',
    },
    { type: 'heading', text: 'Cohorts' },
    {
      type: 'paragraph',
      text: 'Groups a start event by the date in one of its properties, `cohort` by default, and shows the share of each group that sent each later event.',
    },
    {
      type: 'list',
      items: [
        'A bar shows the 95% interval of each share, and a tick the typical share of the 4 groups before it.',
        'A green or red arrow marks a share above or below that typical share, beyond noise.',
        'A hollow dot marks a group too young for 95% of an event, so its share can still grow.',
      ],
    },
    { type: 'heading', text: 'Measure a product without user IDs' },
    {
      type: 'paragraph',
      text: 'Funnels, trends, histograms and cohorts count events, not people, so they work for apps that send no user ID.',
    },
    {
      type: 'table',
      headers: ['Question', 'What to send', 'Insight'],
      rows: [
        [
          'Where do new installs drop off?',
          'Each milestone at most once per install, such as `first_open` and then `first_project`, with a `cohort` property set to the date of the first open.',
          'A funnel of the milestones.',
        ],
        [
          'How does each week of installs do?',
          'The same milestone events.',
          'A cohort table.',
        ],
        [
          'Daily, weekly and monthly users',
          'One event per active day, with properties that say whether it is the first day of its week or month.',
          'A trend with those filters.',
        ],
        [
          'How habitual are your users?',
          'One event per month with the number of active days.',
          'A histogram.',
        ],
      ],
    },
  ],
};
