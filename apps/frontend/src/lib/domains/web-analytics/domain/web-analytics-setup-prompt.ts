export function generateWebAnalyticsSetupPrompt(dto: {
  services: { name: string; apiKey: string }[];
  siteId: string;
  origins: string[];
  apiBaseUrl: string;
  scriptBaseUrl: string;
}): string {
  const apiBase = dto.apiBaseUrl.replace(/\/$/, '');
  const scriptBase = dto.scriptBaseUrl.replace(/\/$/, '');
  const logging = dto.services.length > 0;
  const checks = [
    '/_ld/events forwards x-logdash-client-ip and receives an upstream 202',
    'document.cookie holds no ldv_ or lds_ cookies',
    'localStorage and sessionStorage hold nothing from the script',
    'the browser never calls the upstream analytics host directly',
    ...(logging ? ['the backend sends and flushes one real setup log'] : []),
  ];
  return `Connect this application to Logdash end to end. Inspect the repository and use its framework, deployment platform and existing conventions. Implement and verify the integration.

Website origins: ${dto.origins.join(', ')}
Public analytics site ID: ${dto.siteId}${
    logging
      ? `\nLogdash services and their backend ingest keys:\n${dto.services
          .map((service) => `- ${service.name}: ${service.apiKey}`)
          .join('\n')}`
      : ''
  }

1. First-party web analytics
Create two fixed same-origin routes:
- GET /_ld/script.js proxies ${scriptBase}/sdk/web.js. Serve application/javascript and cache successful responses. Do not forward browser cookies or authorization headers upstream.
- POST /_ld/events proxies ${apiBase}/web_events. Accept JSON only, limit bodies to 32 KB and batches to 20 events, require siteId ${dto.siteId}, and preserve the upstream status. Forward the original browser Origin and User-Agent, and set x-logdash-client-ip to the browser's IP address, read with the framework's client address helper (or the deployment platform's trusted client IP header); without it every visitor shares the server's IP and visitors are undercounted. Never forward browser cookies, authorization, or any backend ingest key. Keep the upstream URL fixed; this must not become an open proxy. Do not cache POST responses.

Render this script once in the server-rendered <head> of the root layout:
<script defer src="/_ld/script.js" data-site="${dto.siteId}" data-endpoint="/_ld/events"></script>

The script automatically tracks initial pageviews, pushState, replaceState, back/forward navigation, restored pages, page leaves and browser_error events. It sets no cookies and keeps no tracking data in browser storage: Logdash counts anonymous visitors with a server-side hash of the IP address and User-Agent under a random salt that rotates daily and is then deleted, and never stores the IP. Do not add a consent gate or cookie banner for it on your own: whether the site needs consent is its owner's decision. If the site already gates analytics behind consent, load it behind that gate. It ignores automated browsers that set navigator.webdriver, such as Playwright and Puppeteer. It counts browsers that send Do Not Track or Global Privacy Control; only if the site's privacy policy promises to honor those signals, add data-respect-dnt to the script tag.
Call window.logdash?.identify(user.id) as soon as the signed-in user is known on each page load, including right after sign-in, and window.logdash?.identify(null) on sign-out. The script is deferred, so the app can start before it has loaded: if window.logdash is still undefined when the user becomes known, make the call from the script element's load event instead. This powers retention, stickiness and returning-user reports. Pass only the opaque account ID, never an email, name or other personal data; the script hashes it in the browser before sending. If the site's privacy settings have an analytics toggle, wire it to window.logdash?.optOut() and window.logdash?.optIn(); opting out stores one flag so the choice persists.
Use window.logdash?.track('event_name') for a few meaningful actions such as signup_completed or checkout_completed. Event names must match [a-z][a-z0-9_]{0,63}. Where a breakdown helps, pass a flat object of properties as the second argument, for example window.logdash?.track('video_played', { quality: '1080p', autoplay: true }). An event takes at most 10 properties with keys matching [a-z][a-z0-9_]{0,39} and string, number or boolean values, stored as strings of up to 100 characters; values containing @ or control characters are dropped, and invalid properties are dropped with a console warning while the event is still sent. Never put emails, names, user IDs, purchase details or other personal data in event names or properties. Keep personal data out of page paths and UTM tags too; replace dynamic user routes with neutral path templates before exposing them to tracking. Query strings and fragments are excluded. A first-party proxy reduces adblocker interference.

${logging ? `${backendLoggingSection(apiBase)}\n\n3` : '2'}. Verify the full integration
Run the app and its checks. Visit two routes, trigger a custom event with properties, sign in so identify runs, and reload. Confirm ${new Intl.ListFormat('en').format(checks)}. Check SPA navigation and sign-out. In an automated browser, set navigator.webdriver to false with an init script before the page loads, or the script stays off. Do not fabricate analytics events or mark setup complete just because the prompt was copied. Logdash verifies receipt of ${logging ? 'both web events and backend logs' : 'web events'}. Report the changed files${logging ? ', environment variables' : ''} and verification results.`;
}

function backendLoggingSection(apiBase: string): string {
  return `2. Backend logging and metrics
Match each backend app in this repository to the service whose name fits it best, and use the first service when nothing fits better. Keep that service's ingest key in a server-only LOGDASH_API_KEY environment variable for the app, outside source control and public/client bundles. Use the installed package manager. Initialize one server logger, capture application errors and critical paths, add useful metrics, and flush before short-lived/serverless execution ends. Do not log secrets, request bodies or personal data. Browser error names are already captured by the tracker; do not expose an ingest key to send browser logs.

Detect the backend language and install the official Logdash SDK for it:
- JavaScript or TypeScript: @logdash/node (npm)
- Python: logdash (pip)
- Go: github.com/logdash-io/go-sdk/logdash
- .NET: Logdash (NuGet)
- Java: io.logdash:logdash (Maven or Gradle)
- Rust: logdash (cargo)
- Ruby: logdash (gem)
- PHP: logdash/php-sdk (composer)
Follow the installed SDK's README for its API and pass it the key from LOGDASH_API_KEY. If no SDK fits the stack, call the HTTP API directly with the header project-api-key set to LOGDASH_API_KEY:
- POST ${apiBase}/logs/batch with {"logs": [{"message", "level", "createdAt", "namespace"}]}, up to 100 logs per request. level is one of info, warning, error, http, verbose, debug or silly. createdAt is an ISO 8601 timestamp.
- PUT ${apiBase}/metrics with {"name", "value", "operation"}. operation "set" stores the value and "change" adds it to the current value.

Fail clearly if LOGDASH_API_KEY is missing, and complete the recommended integration without asking about integration depth.`;
}

export function webAnalyticsScriptTag(dto: {
  src: string;
  siteId: string;
  endpoint: string;
}): string {
  return [
    '<script',
    '  defer',
    `  src="${dto.src}"`,
    `  data-site="${dto.siteId}"`,
    `  data-endpoint="${dto.endpoint}"`,
    '></script>',
  ].join('\n');
}
