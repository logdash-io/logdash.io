import type { LegalDocumentDefinition } from '$lib/domains/shared/ui/legal/LegalDocumentDefinition';

export const cookiesPolicyDefinition: LegalDocumentDefinition = [
  {
    title: 'General remarks',
    paragraphs: [
      'This Cookies Policy is directed to Users and defines the use of cookies (the "Cookies") by the Controller identified in the Privacy Policy.',
      "Cookies are informational data, in particular text files, which are stored on the User's end device. In general, they contain the name of the website they come from, a value and the duration of storage on the User's end device.",
      'The Controller uses Cookies only to sign the User in and to make the Platform work. The website analytics of the Service sets no Cookies.',
    ],
  },
  {
    title: 'Cookies used on the Platform and the Service',
    list: [
      {
        title: 'The Controller sets the following Cookies on logdash.io:',
        list: [
          'logdash_access_token_v0 - keeps the User signed in to the Platform. It is sent only to pages under /app and expires when the sign-in session expires, after at most 7 days;',
          'logdash_oauth_state - protects signing in with GitHub or Google against tampering. It is set when the User starts signing in, cannot be read by scripts on the page, and is deleted when the sign-in finishes or after 10 minutes at the latest;',
          'logdash_onboarding_tier - remembers the plan the User picked before signing in, so that the Platform can open the checkout for that plan after sign-in. It expires after 7 days at the latest;',
          'logdash_domain_setup - remembers for which domains the Platform still shows the setup steps. It is sent only to pages under /app and expires after 30 days.',
        ],
      },
      {
        title:
          'Besides Cookies, the Platform keeps the following in the browser&#39;s storage. Nothing in it is sent to the Controller automatically:',
        list: [
          'logdash_anonymous_preview_v0 (session storage) - holds the token of an anonymous account started from the home page, until the browser tab is closed;',
          'logdash-oauth-popup (session storage) - marks the window that signing in with GitHub or Google opens, until the sign-in finishes;',
          'display preferences the User picks in the Platform (local and session storage), such as time ranges, sort order, time format, the selected SDK, funnels and dismissed hints, until the User clears them;',
          'logdash:opt-out (local storage) - written only when the User opts out of the website analytics, to remember that choice.',
        ],
      },
      {
        title:
          'The website analytics of the Service sets no Cookies and stores nothing in the browser to recognise the User. The Privacy Policy describes how it works.',
      },
      {
        title:
          'Signing in with GitHub or Google and paying with Stripe take place on the websites of those providers, which may set their own Cookies under their own policies.',
      },
    ],
  },
  {
    title: 'Managing Cookies',
    list: [
      {
        title:
          "In many instances, the web browser software (Internet browser) allows Cookies to be stored on the User's end device by default. Users may change their settings regarding Cookies at any time. These settings can be changed, in particular, in such a way as to: block the automatic handling of Cookies in the settings of the Internet browser, notify the User each time Cookies are placed on the User's device or delete Cookies previously placed on the User's device. Detailed information on the possibility and methods of using Cookies is available in the settings of your web browser.",
      },
      {
        title:
          'Blocking or deleting logdash_access_token_v0 signs the User out of the Platform, and blocking it prevents signing in.',
      },
    ],
  },
  {
    title: 'Last updated: 7 October 2026',
    list: [],
  },
];
