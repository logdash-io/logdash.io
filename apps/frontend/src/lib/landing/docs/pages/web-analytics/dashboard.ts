import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics/dashboard',
  title: 'Read the dashboard',
  description:
    'The analytics dashboard shows one day at a time against a typical day, so a flag above or below usual is worth a look.',
  keywords:
    'web analytics dashboard, visits vs visitors, analytics goals, typical day comparison',
  blocks: [
    {
      type: 'paragraph',
      text: 'The dashboard shows one day at a time. It opens on today, live, and steps a day back or forward with the arrows in the toolbar or the left and right arrow keys.',
    },
    { type: 'heading', text: 'What is on the page' },
    {
      type: 'list',
      items: [
        'The 28 days on top show the visits of each day against the middle half of the same weekday, and how many people did your primary goal. Click a day to open it.',
        'The day shows its visits, the visits that stayed, and how many people did each goal, then visits per hour, sources, landing pages and every visit, newest first. Point at a source to see its share in both charts, or click it to keep it there.',
        'Your saved [insights](/docs/web-analytics/insights) follow the day.',
        'Channels, pages, goals, countries, technology, journeys and retention for the day are under **Details**.',
      ],
    },
    {
      type: 'paragraph',
      text: 'A visit stayed when it viewed 2 or more pages, sent a custom event, or lasted 10 seconds or more.',
    },
    { type: 'heading', text: 'Above or below usual' },
    {
      type: 'paragraph',
      text: 'Each day is compared with a typical day: the median of the same weekday in the 4 weeks before, and while today is in progress, up to the same time of day.',
    },
    {
      type: 'list',
      items: [
        'A count reads above or below usual only outside typical ± 2√typical.',
        'A rate reads above or below usual only when the typical rate falls outside its 95% interval.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Everything else reads normal, so a flag is worth a look.',
    },
    { type: 'heading', text: 'Goals' },
    {
      type: 'paragraph',
      text: 'Pick the goals with **Goals** in the toolbar, one column each: the primary goal, what success means for your site, then up to 9 more. Everyone on the domain sees the same pick. Until you pick, the dashboard shows the 2 goals reached most in the last 28 days.',
    },
    {
      type: 'paragraph',
      text: 'Each goal counts the people who sent its event that day, on your website or in any of your apps, on its own. Logdash does not try to follow one person from your website into your app, so a goal can have more people than the one before it, such as existing users who open your app.',
    },
    { type: 'heading', text: 'Visits and people' },
    {
      type: 'paragraph',
      text: 'Logdash forgets anonymous visitors every day, so it cannot tell whether a visitor on Monday is the same one on Tuesday. The dashboard counts visits instead:',
    },
    {
      type: 'table',
      headers: ['Count', 'What it is'],
      rows: [
        [
          'Visits',
          'One visitor on one day. Someone who comes back on three days is three visits, and visits are never added up across days. Breakdowns and conversion rates count visits the same way.',
        ],
        [
          'People',
          'The signed-in users you identify, each once over the whole range, however many days they come back. Goals count each person once per day.',
        ],
      ],
    },
    {
      type: 'paragraph',
      text: 'To count people, call [identify](/docs/web-analytics/identify) on your website and pass `userId` from [your apps](/docs/web-analytics/app-events).',
    },
    {
      type: 'callout',
      text: 'The anonymous ID changes at midnight UTC, so in a time zone far from UTC a visitor who comes back later the same day can count as a second visit.',
    },
  ],
};
