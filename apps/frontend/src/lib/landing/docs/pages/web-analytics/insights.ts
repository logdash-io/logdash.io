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
      text: 'Insights answer questions that span weeks or months. Add them with **Add insight** below the day. Everyone on the domain sees the same cards in the same layout, and each card has its own period. Edit, move or remove a card from its menu.',
    },
    {
      type: 'callout',
      text: 'Your coding agent can build insights for you through the [MCP server](/docs/mcp), such as "add a funnel from first open to first merge, and a weekly cohort table".',
    },
    { type: 'heading', text: 'Arrange your dashboard' },
    {
      type: 'paragraph',
      text: 'Split many cards into views and sections, and decide which cards show and how wide they are. Everyone on the domain sees the same layout.',
    },
    {
      type: 'list',
      items: [
        '**Views** are dashboards of their own, such as Company, Traffic and Product, with a tab each above the cards. Open **Layout** to add, rename, reorder or remove them. The first view opens by default and holds every card that has no view.',
        '**Sections** group the cards of a view under a title. Press a title to close or open its cards. A section marked as collapsed starts closed.',
        '**Traffic cards** are the day, sources and landing pages. Tick **Show visitors, sources and the other traffic cards** on the views that should show them.',
        'To **hide** a card, press the eye on its header. **Hidden** above the cards lists them, and **Show** brings one back.',
        'To **reorder** cards, drag one by its grip onto another card, or onto a section. **Move earlier** and **Move later** in the card menu do the same one step at a time, and **Move to** sends a card to another view.',
        'To **resize** a card, press the arrows on its header to switch between half and full width. A card with no width of its own is wide when it is a cohort table or a funnel of columns with more than 3 steps.',
      ],
    },
    { type: 'heading', text: 'Tabbed cards' },
    {
      type: 'paragraph',
      text: 'One card can hold several charts behind tabs, so related lines sit together. In the editor, press **Add a tab**. Each tab is a full insight with its own name, type and period, and the name of the tab is its label. A card takes 2 to 6 tabs.',
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
      text: 'Counts up to 5 events per day, week or month, each with its own filters, on one chart. Give a line a **label** to name it in the legend, such as Weekly active.',
    },
    {
      type: 'list',
      items: [
        'A line counts per the bucket under **Count per**, unless you pick its own bucket in the line. **Same as chart** uses the bucket under **Count per**.',
        'Lines with different buckets share a day axis. A weekly or monthly line steps up on the first day of each week or month, and its last step is dashed until that week or month ends.',
        'Weeks start on Monday and buckets follow your time zone. The first bucket counts only from the start of the period.',
        'The number beside a line is the events it counted in the period.',
      ],
    },
    { type: 'heading', text: 'Compare several products' },
    {
      type: 'paragraph',
      text: 'One domain can hold several apps that send different events. Make one trend for each app with a daily, a weekly and a monthly line, and label each line, such as Malini daily, Malini weekly and Malini monthly.',
    },
    {
      type: 'list',
      items: [
        'Each app sends one marker per active day, named after the app, such as `malini_desktop_day`, `grip_day` and `tony_day`. The marker has the properties `week_first` and `month_first`, set to `yes` on the first active day of the week or month.',
        'The daily line counts the marker. The weekly line counts it with the filter `week_first` = `yes` and the bucket **Per week**. The monthly line counts it with the filter `month_first` = `yes` and the bucket **Per month**.',
        'A line stays empty until its app sends the marker. A trend counts events, and anonymous visitor IDs change every day, so the app says which active day is the first of its week or month.',
        'The week of the app must match the dashboard, which starts it on Monday. A week that does not match can count a person twice or not at all.',
      ],
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
          'A trend with a daily, a weekly and a monthly line, each with its own bucket and filter.',
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
