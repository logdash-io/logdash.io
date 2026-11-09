import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics-privacy',
  title: 'Web analytics and privacy',
  description:
    'How Logdash counts visitors without cookies, what it stores and for how long, and what to tell your visitors.',
  metaTitle: 'Web analytics and privacy | Logdash Docs',
  keywords:
    'cookieless analytics gdpr, analytics privacy policy text, visitor id hash, analytics data retention',
  blocks: [
    {
      type: 'paragraph',
      text: 'The Logdash tracker sets no cookies and keeps nothing in the browser to recognise a visitor. Anonymous visitors are counted on the server with an ID that changes every day, IP addresses are never stored, and signed-in users are recognised only by a hash computed in their browser. This page describes exactly what happens, so you can describe it to your visitors.',
    },
    {
      type: 'paragraph',
      text: 'To install the tracker and use its API, see [Add the web analytics tracker](/docs/web-analytics).',
    },
    { type: 'heading', text: 'How visitors are counted' },
    {
      type: 'paragraph',
      text: 'For every event, the Logdash server computes the visitor ID as a SHA-256 hash in hex:',
    },
    {
      type: 'code',
      language: 'javascript',
      code: "sha256(dailySalt + ':' + siteId + ':' + clientIp + ':' + userAgent)",
    },
    {
      type: 'list',
      items: [
        'The daily salt is 32 random bytes, created for each UTC day. It is held only in Redis and expires 30 minutes after that day ends.',
        "Once the salt is gone, nobody can recompute that day's visitor IDs, Logdash included. The same visitor gets a new ID every day.",
        'The IP address is used only to compute the hash and is never stored.',
        'The User-Agent goes into the hash and is reduced to device type, browser and operating system. The full string is not stored.',
        "Behind a first-party proxy, the proxy passes the visitor's IP address in the `x-logdash-client-ip` header, so the hash uses the visitor's address rather than your server's. The proxy forwards `Origin`, `User-Agent` and `x-logdash-client-ip`, never cookies, authorization headers or ingest keys.",
      ],
    },
    {
      type: 'paragraph',
      text: "Sessions live on the server too. A session ends after 30 minutes without events or after 24 hours, and the next event starts a new one. During the first 30 minutes of a UTC day, a visitor whose session started the day before continues that session and keeps the previous day's visitor ID.",
    },
    {
      type: 'paragraph',
      text: 'Because the ID changes every day, an anonymous visitor who comes back the next day counts as a new visit. Retention, stickiness and comebacks are measured for identified users only.',
    },
    {
      type: 'paragraph',
      text: "Events your apps send to `/events` are counted the same way, with the app's name added to the hash, so an anonymous visitor of one app is never linked to the website or another app:",
    },
    {
      type: 'code',
      language: 'javascript',
      code: "sha256(dailySalt + ':' + siteId + ':' + clientIp + ':' + userAgent + ':' + app)",
    },
    { type: 'heading', text: 'Signed-in users' },
    {
      type: 'paragraph',
      text: "When your app passes the signed-in user's ID to `identify`, the tracker hashes it in the browser before anything is sent: `sha256(siteId + ':' + id)`, in lowercase hex. The raw ID never leaves the browser. Because the site ID is part of the hash, the same user ID gives a different hash on every site.",
    },
    {
      type: 'list',
      items: [
        'A value that contains `@` or is longer than 256 characters is ignored, so an email address is never sent by mistake.',
        'The identity lives in memory only, and `identify(null)` clears it when the user signs out.',
        'The server never copies a user ID onto an event sent without one, so events after sign-out are not attributed to the previous user.',
        "Your apps send the user ID with each event over HTTPS. The server computes the same `sha256(siteId + ':' + id)` on arrival and stores only the hash, never the ID, so one user is one person across the website and apps.",
      ],
    },
    {
      type: 'paragraph',
      text: 'Pass a stable internal ID, never an email address or a name. The hash is pseudonymous, not anonymous: your site ID is public in the script tag, so anyone can hash guessable IDs, such as small sequential numbers, and compare.',
    },
    { type: 'heading', text: 'Custom event properties' },
    {
      type: 'paragraph',
      text: 'A custom event can carry up to 10 properties, such as a quality, a theme or a variant. A value that contains `@` or a control character is dropped, so an email address is never stored by mistake.',
    },
    {
      type: 'paragraph',
      text: 'Never put emails, names, user IDs, purchase details or other personal data in event names or properties. Properties describe what happened, never who did it.',
    },
    { type: 'heading', text: 'Opt-out and browser storage' },
    {
      type: 'paragraph',
      text: 'The tracker does not start in automated browsers that set `navigator.webdriver`, and Logdash drops events from known bots and from datacenter and cloud networks. It counts browsers that send Do Not Track or Global Privacy Control like any other, unless the script tag has `data-respect-dnt`. Your site can let visitors opt out with `optOut`, described in [Let visitors opt out](/docs/web-analytics/opt-out).',
    },
    {
      type: 'paragraph',
      text: "The tracker sets no cookies and writes nothing to `localStorage` or `sessionStorage`, except `localStorage['logdash:opt-out'] = '1'` when a visitor opts out, so the choice survives reloads. On load it deletes the `ldv_` and `lds_` cookies that earlier versions of the tracker set.",
    },
    { type: 'heading', text: 'What Logdash stores' },
    {
      type: 'paragraph',
      text: 'Each event is stored with:',
    },
    {
      type: 'list',
      items: [
        'the event name: `pageview`, `pageleave`, `browser_error` or one of your custom events. `browser_error` carries no error message or stack trace.',
        'for custom events, the properties you pass to `track`, after the checks described above.',
        'the host name and path of the page, without query string or fragment. Path segments that contain `@` become `:redacted`, and segments that look like database IDs, UUIDs or numbers of four or more digits become `:id`.',
        'the host name of the referring site, UTM source, medium, campaign, term and content, with `ref`, `via` or `source` as the source when `utm_source` is missing, and the name of an ad click ID parameter such as `gclid`, never its value. They come from the first event of the session.',
        'device type, browser and operating system, derived from the User-Agent.',
        "a country, looked up from the IP address in a copy of the [DB-IP](https://db-ip.com) database on the Logdash server, or derived from the browser's time zone when the lookup has no answer. The IP address itself is not stored.",
        'the time of the event.',
        'the visitor ID, a random session ID and, for identified users, the user hash.',
        'for events from your apps, the app name instead of the page, referrer, campaign and browser details.',
      ],
    },
    {
      type: 'paragraph',
      text: "While a session is live, its ID, start time and attribution are held in Redis. They expire 30 minutes after the session's last event.",
    },
    { type: 'heading', text: 'How long data is kept' },
    {
      type: 'paragraph',
      text: 'Events are deleted automatically when the retention period of your plan has passed, counted from the time of each event. The retention that applies is the one of the plan you had when the event arrived.',
    },
    { type: 'plan-limits', key: 'webAnalytics' },
    {
      type: 'paragraph',
      text: 'Deleting a domain in Logdash deletes all of its web analytics events. Copies in encrypted backups are deleted when the backups expire, 14 days after they were made.',
    },
    { type: 'heading', text: 'Consent' },
    {
      type: 'paragraph',
      text: 'Whether your site needs consent for analytics depends on the law that applies to you and your visitors, and on how you use the data. You decide that, not Logdash. This page and the data processing agreement describe the processing precisely, so you can make that decision and explain it to your visitors. If you decide you need consent, load the script only after the visitor agrees.',
    },
    { type: 'heading', text: 'Text for your privacy policy' },
    {
      type: 'paragraph',
      text: 'Adapt this text to your site: fill in the parts in square brackets, remove the bracketed sentences that do not apply, and change the legal basis if you rely on consent.',
    },
    {
      type: 'code',
      language: 'text',
      code: `We measure how this website is used with Logdash web analytics. It sets no cookies and stores nothing in your browser to recognise you. To count visits, Logdash computes a pseudonymous visitor ID on its server: a SHA-256 hash of your IP address, your browser's User-Agent, our site ID and a random value that changes every day and is deleted 30 minutes after the day ends (UTC). Your IP address is not stored, and anonymous visits on different days are not linked to each other.

For each page you visit, we collect the page address without query parameters, the domain of the website that referred you, campaign tags, your device type, browser and operating system, and a country derived from your IP address, or from your time zone if the IP address gives none. [When you are signed in, your visits are also linked to a pseudonymous hash of your account ID, computed in your browser. Your account ID itself is not sent.] [For some actions, such as [actions], we also record the options you chose, never personal data.]

Logdash processes this data on our behalf as a processor and deletes it after [retention period]. We process it on the basis of our legitimate interest in understanding how our website is used and improving it (Art. 6(1)(f) GDPR). [The analytics does not run if your browser sends Global Privacy Control or Do Not Track.] [You can turn analytics off in our privacy settings.] To object or to ask about your data, contact [contact address].`,
    },
    { type: 'heading', text: 'Data processing agreement' },
    {
      type: 'paragraph',
      text: 'When you use Logdash for web analytics or logs, Logdash processes personal data on your behalf as a processor. The [data processing agreement](/dpa) covers the subject and duration of the processing, the categories of data, the security measures, the sub-processors, breach notification and deletion.',
    },
  ],
};
