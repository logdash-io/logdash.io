export function generateWebAnalyticsSetupPrompt(dto: {
  services: { name: string; apiKey: string }[];
  siteId: string;
  origins: string[];
  apiBaseUrl: string;
  scriptBaseUrl: string;
}): string {
  const apiBase = dto.apiBaseUrl.replace(/\/$/, '');
  const scriptBase = dto.scriptBaseUrl.replace(/\/$/, '');
  return `Connect this application to Logdash end to end. Inspect the repository and use its framework, deployment platform and existing conventions. Implement and verify the integration.

Website origins: ${dto.origins.join(', ')}
Public analytics site ID: ${dto.siteId}
Logdash services and their backend ingest keys:
${dto.services.map((service) => `- ${service.name}: ${service.apiKey}`).join('\n')}

1. First-party web analytics
Create two fixed same-origin routes:
- GET /_ld/script.js proxies ${scriptBase}/sdk/web.js. Serve application/javascript and cache successful responses. Do not forward browser cookies or authorization headers upstream.
- POST /_ld/events proxies ${apiBase}/web_events. Accept JSON only, limit bodies to 32 KB and batches to 20 events, require siteId ${dto.siteId}, and preserve the upstream status. Forward the original browser Origin and User-Agent. Never forward browser cookies, authorization, or any backend ingest key. Keep the upstream URL fixed; this must not become an open proxy. Do not cache POST responses.

Load this script once in the root browser layout:
<script defer src="/_ld/script.js" data-site="${dto.siteId}" data-endpoint="/_ld/events"></script>

The script automatically tracks initial pageviews, pushState, replaceState, back/forward navigation, restored pages, page leaves and browser_error events. It creates a site-scoped random visitor cookie lasting one year and a session cookie that ends after 30 minutes of inactivity or 24 hours, both shared across the site's subdomains. It respects Do Not Track and Global Privacy Control and ignores automated browsers that set navigator.webdriver, such as Playwright and Puppeteer. Load it only after the site's existing analytics consent permits it; use window.logdash?.stop() on consent withdrawal. If no consent flow exists, add the site's chosen consent gate before loading the script.
Use window.logdash?.track('event_name') for a few meaningful actions such as signup_completed or checkout_completed. Event names must match [a-z][a-z0-9_]{0,63}. The API accepts event names only, without properties. There is no identify API: never send emails, account IDs, names, purchase details or other personal data. Keep personal data out of page paths and UTM tags too; replace dynamic user routes with neutral path templates before exposing them to tracking. Query strings and fragments are excluded. A first-party proxy reduces adblocker interference.

2. Backend logging and metrics
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

Fail clearly if LOGDASH_API_KEY is missing, and complete the recommended integration without asking about integration depth.

3. Verify the full integration
Run the app and its checks. After analytics consent, visit two routes, trigger a custom event, and reload: the visitor cookie must stay the same. Confirm /_ld/events receives an upstream 202, the browser never calls the upstream analytics host directly, and the backend sends and flushes one real setup log. Check SPA navigation and consent withdrawal. In an automated browser, set navigator.webdriver to false with an init script before the page loads, or the script stays off. Do not fabricate analytics events or mark setup complete just because the prompt was copied. Logdash verifies receipt of both web events and backend logs. Report the changed files, environment variables and verification results.`;
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
