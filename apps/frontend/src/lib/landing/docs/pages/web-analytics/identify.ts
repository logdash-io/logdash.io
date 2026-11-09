import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics/identify',
  title: 'Identify signed-in users',
  description:
    'Pass the signed-in user to identify to measure retention and returning visitors. The ID is hashed in the browser and never leaves it.',
  keywords:
    'identify users analytics, user retention analytics, returning visitors, pseudonymous user id',
  blocks: [
    {
      type: 'paragraph',
      text: 'Anonymous visitors get a new ID every day, so retention and returning visitors are measured for identified users only. Once your app knows who is signed in, pass their user ID to `identify`.',
    },
    { type: 'heading', text: 'Call identify' },
    {
      type: 'paragraph',
      text: 'The identity lives in memory only, so call it on every page load, and call it with `null` when the user signs out.',
    },
    {
      type: 'code',
      language: 'javascript',
      title: 'On every page load, once the user is known',
      code: 'window.logdash?.identify(user.id);',
    },
    {
      type: 'code',
      language: 'javascript',
      title: 'On sign-out',
      code: 'window.logdash?.identify(null);',
    },
    {
      type: 'paragraph',
      text: 'The script is deferred, so your app can know the user before it has loaded. If `window.logdash` is still undefined at that point, call `identify` from the `load` event of the script element.',
    },
    { type: 'heading', text: 'What identify accepts' },
    {
      type: 'list',
      items: [
        '`id` is a string or a number. `null`, `undefined` or an empty string clears the identity, and events tracked after that are sent without a user ID.',
        'A value that contains `@` or is longer than 256 characters is ignored with a console warning and leaves the identity as it was, so an email address is never sent by mistake.',
        'Events of the page load that are still waiting to be sent when the hash is ready get the user ID too, so the first pageview is attributed when `identify` follows within about a second.',
      ],
    },
    {
      type: 'callout',
      tone: 'warning',
      text: 'Pass a stable internal ID, never an email address or a name.',
    },
    { type: 'heading', text: 'How the ID is hashed' },
    {
      type: 'paragraph',
      text: "The tracker hashes the ID in the browser as `sha256(siteId + ':' + id)`, so the raw ID never leaves it. Hashing needs `crypto.subtle`, which browsers offer only in secure contexts such as HTTPS pages. Without it, `identify` does nothing.",
    },
    {
      type: 'paragraph',
      text: 'Your apps can pass the same user as `userId` with [their own events](/docs/web-analytics/app-events), and the server computes the same hash, so one user is one person across your website and apps. [Web analytics and privacy](/docs/web-analytics-privacy#signed-in-users) has the details.',
    },
  ],
};
