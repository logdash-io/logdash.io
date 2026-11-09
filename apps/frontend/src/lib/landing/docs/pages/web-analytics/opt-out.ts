import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics/opt-out',
  title: 'Let visitors opt out',
  description:
    'Give visitors an analytics toggle with optOut and optIn, and keep the tracker from starting in browsers that send Do Not Track.',
  keywords:
    'analytics opt out, do not track analytics, global privacy control, disable analytics',
  blocks: [
    {
      type: 'paragraph',
      text: 'The tracker does not start in automated browsers that set `navigator.webdriver`, and Logdash drops events from known bots and from datacenter and cloud networks. Everything else is up to you and your visitors.',
    },
    { type: 'heading', text: 'Add an analytics toggle' },
    {
      type: 'paragraph',
      text: 'If your site has privacy settings, add an analytics toggle that calls `optOut` and `optIn`:',
    },
    {
      type: 'code',
      language: 'javascript',
      code: `window.logdash?.optOut();
window.logdash?.optIn();`,
    },
    {
      type: 'table',
      headers: ['Method', 'What it does'],
      rows: [
        [
          '`optOut()`',
          "Stops tracking at once: it drops queued events and removes its timers, listeners and history hooks. It writes `localStorage['logdash:opt-out'] = '1'` so the choice survives reloads.",
        ],
        [
          '`optIn()`',
          'Removes that flag and starts tracking again with a fresh pageview. `window.logdash` exists while a visitor is opted out, so `optIn()` stays reachable.',
        ],
        ['`stop()`', 'Still works as an alias of `optOut()`.'],
      ],
    },
    { type: 'heading', text: 'Respect Do Not Track' },
    {
      type: 'paragraph',
      text: 'The tracker counts browsers that send Do Not Track or Global Privacy Control like any other. To keep it from starting in them, add `data-respect-dnt` to the script tag:',
    },
    {
      type: 'code',
      language: 'html',
      title: 'index.html',
      code: `<script
  defer
  src="/_ld/script.js"
  data-site="your-site-id"
  data-endpoint="/_ld/events"
  data-respect-dnt
></script>`,
    },
    { type: 'heading', text: 'Consent' },
    {
      type: 'paragraph',
      text: 'Whether your site needs consent for analytics is your call. [Web analytics and privacy](/docs/web-analytics-privacy#consent) describes the processing precisely, so you can decide and explain it to your visitors. If you need consent, load the script only after the visitor agrees.',
    },
  ],
};
