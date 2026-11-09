import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics/custom-events',
  title: 'Custom events',
  description:
    'Count the actions that matter, such as a sign-up or a played video, and break them down by properties in the Goals card.',
  keywords:
    'custom events analytics, event properties, track events javascript, analytics goals',
  blocks: [
    {
      type: 'paragraph',
      text: 'Call `track` for the actions you want to count, such as `signup_completed`. To break an event down in the dashboard, pass a flat object of properties as the second argument.',
    },
    { type: 'heading', text: 'Track an event' },
    {
      type: 'code',
      language: 'javascript',
      code: `window.logdash?.track('video_played', {
  quality: '1080p',
  autoplay: true,
  chapter: 2,
});`,
    },
    {
      type: 'paragraph',
      text: 'Event names match `[a-z][a-z0-9_]{0,63}`: lowercase, starting with a letter, with underscores between words.',
    },
    { type: 'heading', text: 'Properties' },
    {
      type: 'table',
      headers: ['Rule', 'Limit'],
      rows: [
        ['Properties per event', 'At most 10.'],
        ['Keys', 'Match `[a-z][a-z0-9_]{0,39}`.'],
        [
          'Values',
          'Strings, numbers or booleans. They are stored as strings, trimmed and cut to 100 characters, so `2` and `true` become `"2"` and `"true"`.',
        ],
        [
          'Dropped values',
          'A value that contains `@` or a control character is dropped, so an email address is never stored by mistake.',
        ],
        [
          'Distinct values',
          'Each property keeps up to 500 distinct values per site within your retention period. Later values are counted as `(other)`.',
        ],
        [
          'Keys per site',
          'Up to 50. Properties with further keys are dropped.',
        ],
      ],
    },
    {
      type: 'list',
      items: [
        'Invalid properties are dropped with one console warning per page load, and the event is still sent. The API checks every request against the same rules.',
        'Only custom events carry properties. `pageview`, `pageleave` and `browser_error` never do.',
      ],
    },
    {
      type: 'callout',
      tone: 'warning',
      text: 'Never put emails, names, user IDs, purchase details or other personal data in event names or properties. Properties describe what happened, such as a quality, a theme or a variant, never who did it. Use [identify](/docs/web-analytics/identify) for the signed-in user.',
    },
    { type: 'heading', text: 'Goals' },
    {
      type: 'paragraph',
      text: 'Custom events are the goals you pick in the toolbar, and each one appears in the **Goals** card under **Details**. Click it to see its trend through the day, with completions, visits, people and a breakdown by each property.',
    },
    {
      type: 'paragraph',
      text: 'Clicking a property value keeps only the events with that value, and narrows the other reports to the visitors who sent it. How goals are counted is described in [Read the dashboard](/docs/web-analytics/dashboard#goals).',
    },
    { type: 'heading', text: 'Events from servers and apps' },
    {
      type: 'paragraph',
      text: 'The same events can come from your backend, a desktop app or a CLI. See [Events from your apps](/docs/web-analytics/app-events).',
    },
  ],
};
