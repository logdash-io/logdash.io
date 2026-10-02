import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family F. The intent is "how do I watch this kind of thing", so every page
 * starts from what a Logdash check can and cannot see for that asset, then
 * gives the route or script that makes it checkable.
 *
 * Assets that need a check Logdash does not have yet (SSL and domain expiry,
 * DNS, TCP port, ping, keyword) get no page until the check ships. The hub is
 * a plain list.
 */
export const assetsFamily: SeoFamily = {
  key: 'monitoring',
  hubPath: '/monitoring',
  hubLabel: 'All monitoring guides',
  title: 'Uptime monitoring by what you run | Logdash',
  description:
    'How to monitor an API, a REST API, a website, a webhook receiver, a GraphQL server and a database, with the code and the setup for each.',
  intro:
    'One page per thing you run, each with the code that makes it checkable and the monitor that watches it.',
};

export const assetsPages: SeoPage[] = [
  {
    slug: 'api',
    h1: 'API uptime monitoring',
    answer:
      'API uptime monitoring sends a GET to one public route of your API on a fixed interval, records the status code and the response time, and alerts you the moment the answer falls outside 200-399 or does not arrive within 10 seconds.',
    meta: {
      title: 'API uptime monitoring with Telegram alerts | Logdash',
      description:
        'What an API uptime check asserts, why it needs a public health route, and how to get a Telegram alert within 5 minutes, 1 minute or 15 seconds.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Most API outages are not the process dying. The server keeps accepting connections while the database pool is exhausted, and every real request returns 500. A check pointed at the bare API host gets a 404 or a framework welcome page and reports green through the whole incident. So the first decision is not which tool, it is which route. Point the check at a route that fails for the same reasons a real request fails.',
      },
      { type: 'heading', text: 'What an API uptime checker asserts' },
      {
        type: 'paragraph',
        text: 'Here is exactly what a Logdash check does, read from the monitor code rather than the marketing page. One GET request, one 10-second deadline for the whole exchange, up to 5 redirects followed. Then a verdict on the status line.',
      },
      {
        type: 'list',
        items: [
          'Status code: 200 to 399 is up. Any 4xx or 5xx is down.',
          'Nothing answered: a refused connection, a reset, a hostname that does not resolve, or no reply within 10 seconds is down, recorded as status 0 with the reason.',
          'Response time: recorded on every check and charted. There is no threshold alert on it yet, so an API that answers in 9 seconds stays green.',
          'Body, JSON fields and response headers: not asserted. Only the status line decides up or down.',
        ],
      },
      {
        type: 'paragraph',
        text: 'The alert fires on the transition. The first failed check flips the monitor to down and sends the status code plus the first 1,000 characters of the response body, so the error message your API returned lands in the alert. The next good check sends the recovery.',
      },
      { type: 'heading', text: 'No custom headers, no auth' },
      {
        type: 'paragraph',
        text: 'A monitor sends a plain GET with no custom headers, no bearer token and no body. The URL also has to resolve to a public address, so localhost and private IP ranges are refused. That means the monitored route has to be public. For a health route that is the right design anyway: one boolean in the body, no versions, no hostnames, nothing worth stealing. If the API only lives on a private network, push monitors on Pro flip the direction: something inside calls `POST https://api.logdash.io/ping/<monitorId>` at least once every 15 seconds, and silence is the failure.',
      },
      { type: 'heading', text: 'The route to point it at' },
      {
        type: 'code',
        language: 'javascript',
        title: 'server.js',
        code: `import express from 'express';
import pg from 'pg';

const app = express();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Registered before the auth middleware. A monitor sends no headers,
// so behind auth this route would answer 401 and read as down.
app.get('/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await pool.query('select 1');
    res.status(200).json({ ok: true });
  } catch {
    // 503 is what flips the monitor to down.
    res.status(503).json({ ok: false });
  }
});

// Everything registered after this line needs a key.
app.use((req, res, next) => {
  if (req.get('authorization') !== \`Bearer \${process.env.API_KEY}\`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
});

app.get('/v1/orders', (req, res) => res.json([]));

app.listen(process.env.PORT ?? 3000);`,
      },
      { type: 'heading', text: 'API status monitoring in three steps' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the health URL',
            text: 'Create a service in Logdash and paste https://api.yourapp.com/health. The first check runs straight away, so a wrong path shows up in seconds, not during an incident.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder at $9 a month, every 15 seconds on Pro at $15 a month. At 15 seconds that is 5,760 requests a day against the route, which is why it runs select 1 and nothing heavier.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the database and leave the API running. The route starts returning 503, the next check flips the monitor to down, and a Telegram alert arrives with the monitor name, the status code and the error body.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Checkly',
        them: 'Checkly',
        rows: [
          {
            feature: 'What a check can assert',
            logdash: 'Status code 200-399 within 10 seconds',
            them: 'Status code, headers, JSON body, text body and response time',
            winner: 'them',
          },
          {
            feature: 'Request options',
            logdash: 'GET only, no headers, no auth',
            them: 'Any common method, custom headers, request body, basic auth, setup scripts',
            winner: 'them',
          },
          {
            feature: 'Free plan volume',
            logdash: '5 services every 5 minutes, about 43,000 checks a month',
            them: '10,000 API check runs a month',
            winner: 'logdash',
          },
          {
            feature: 'Free alert channels',
            logdash: 'Telegram, plus a GET-only webhook with no payload',
            them: 'Email, Slack and webhook',
            winner: 'them',
          },
          {
            feature: 'Cheapest paid plan',
            logdash: '$9 a month, 1-minute checks',
            them: '$24 a month',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Checkly',
        reasons: [
          'You need to assert on the JSON body, a header or a field value, not just the status line.',
          'The endpoint you care about needs a token, a POST body or a login step before it answers.',
          'You want the checks written in TypeScript in the same repository as the API and deployed from CI.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is API uptime monitoring?',
        answer:
          'A service outside your infrastructure calls one route of your API on a schedule and alerts you when it stops answering or answers with an error. Logdash does it every 5 minutes free, every minute on Builder and every 15 seconds on Pro.',
      },
      {
        question: 'What is API status monitoring?',
        answer:
          'The same check, plus somewhere to show the result. Every Logdash monitor can sit on a public status page, and the free plan includes one, so customers see the outage before they write to you about it.',
      },
      {
        question: 'What does an API uptime checker actually check?',
        answer:
          'In Logdash, the status code and whether a reply arrived within 10 seconds. 200 to 399 is up, everything else is down. Response time is recorded and charted on every check but does not trigger an alert on its own.',
      },
      {
        question: 'Is there a free API uptime checker?',
        answer:
          'Yes. Logdash checks 5 services every 5 minutes for free, with Telegram alerts and one public status page. If the check needs a token or a JSON body assertion, the free Checkly Hobby plan gives 10,000 API check runs a month.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'rest-api',
    h1: 'REST API monitoring',
    answer:
      'REST API monitoring means requesting one public GET route that touches the same database your endpoints use, on a fixed interval from outside your servers, and alerting on any status outside 200-399, which the free plans of Logdash, UptimeRobot and Better Stack all do.',
    meta: {
      title: 'REST API monitoring, free tools compared | Logdash',
      description:
        'Which REST route to monitor, a curl script you can run today, what the free plans of Logdash and UptimeRobot actually include, and where each one stops.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A REST API fails in two kinds of ways. The kind an uptime check sees: it stops answering, it answers 5xx, it takes longer than the timeout. And the kind it does not: a field disappears from the JSON, one endpoint out of forty breaks, auth starts rejecting valid tokens. Uptime monitoring is for the first kind. Contract tests in CI are for the second. Buying a monitor to do the job of a test suite is how people end up with 200 checks and still no idea why checkout broke.',
      },
      { type: 'heading', text: 'REST API health check: which route to watch' },
      {
        type: 'list',
        items: [
          'Not the root path. Many REST frameworks answer `/` with a 404 or a static banner, and neither tells you the database is reachable.',
          'Not the docs page. Swagger UI is static files and stays up long after the API behind it has gone.',
          'A `/health` route that runs one cheap query, `select 1`, and returns 503 when it throws. It fails for the same reason your real endpoints fail.',
          'Or one public read endpoint with a small limit, such as a product list capped at one item, if you would rather watch a real path than a synthetic one.',
          'One route per service is enough. Ten monitors on ten endpoints sharing one database just send ten alerts for one outage.',
        ],
      },
      { type: 'heading', text: 'The free tool you already have' },
      {
        type: 'code',
        language: 'bash',
        title: 'rest-check.sh',
        code: `#!/usr/bin/env bash
# Exits 1 if any endpoint answers outside 200-399 or takes over 10s.
for url in \\
  https://api.example.com/health \\
  "https://api.example.com/v1/products?limit=1"; do
  # A timeout or a sixth redirect makes curl fail: count it as down.
  code=$(curl -s -o /dev/null -L --max-redirs 5 --max-time 10 \\
    -w '%{http_code}' "$url") || code=000
  echo "$code $url"
  if [ "$code" -lt 200 ] || [ "$code" -ge 400 ]; then exit 1; fi
done`,
      },
      {
        type: 'paragraph',
        text: 'That script uses the same rules a Logdash monitor uses: GET, 5 redirects, 10 seconds, 200 to 399 is up, and a timeout prints 000 and fails. It belongs in your deploy pipeline as a smoke test. As a monitor it has one flaw. It runs on a machine you own, so the night that machine has a problem is the night nobody gets told.',
      },
      { type: 'heading', text: 'REST API monitoring free tools, honestly' },
      {
        type: 'paragraph',
        text: 'Four hosted options check a REST endpoint at no cost. Better Stack gives 10 monitors at 3-minute checks. Checkly gives 10,000 API check runs a month with body and header assertions. UptimeRobot gives 50 monitors at 5 minutes. Logdash gives 5 services at 5 minutes, with Telegram alerts, a public status page, and the logs from the same API on the same screen if you add an SDK. None of the four is a bad pick. The table puts Logdash next to the one people most often start with.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the service',
            text: 'Create a service in Logdash and paste the health URL. The first check runs immediately and records the status code and response time.',
          },
          {
            title: 'Connect Telegram once',
            text: 'Add a Telegram channel at the domain level and every monitor in it can use it. A webhook channel works the same way if alerts should reach your own API instead.',
          },
          {
            title: 'Make it fail',
            text: 'Return 503 from the health route, or stop the database. One interval later the monitor flips to down and a Telegram alert arrives with the status code and the error body your API sent back.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs UptimeRobot',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Free monitors',
            logdash: '5 services, one HTTP monitor each',
            them: '50 monitors',
            winner: 'them',
          },
          {
            feature: 'Free check interval',
            logdash: 'Every 5 minutes',
            them: 'Every 5 minutes',
            winner: 'tie',
          },
          {
            feature: 'Custom request headers',
            logdash: 'Not supported on any plan',
            them: 'On paid plans',
            winner: 'them',
          },
          {
            feature: 'Slow response alerts',
            logdash: 'None, response time is charted only',
            them: 'Paid plans, threshold from 50 to 5,000 ms',
            winner: 'them',
          },
          {
            feature: '15-second checks',
            logdash: 'Pro, $15 a month',
            them: 'Scale, €65 a month billed yearly, €77 monthly',
            winner: 'logdash',
          },
          {
            feature: 'Logs and metrics from the API itself',
            logdash: 'Eight SDKs into the same service view',
            them: 'Not part of the product',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'You have more than five REST services to watch and a budget of zero. Fifty free monitors is ten times what Logdash gives.',
          'The only route worth checking needs an API key header. UptimeRobot Solo sends one from €9 a month billed yearly. Logdash cannot send one on any plan.',
          'You want an alert when the API gets slow, not only when it fails. UptimeRobot Solo alerts on a threshold you set, Logdash only charts response time.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What are good REST API monitoring tools?',
        answer:
          'For status and uptime: Logdash, UptimeRobot and Better Stack. For assertions on the JSON body and authenticated requests: Checkly. For contract correctness: tests in CI, not a monitor. Most small teams need one from the first group and a test suite.',
      },
      {
        question:
          'Are there REST API monitoring free tools that work for production?',
        answer:
          'Yes. The Logdash free plan checks 5 services every 5 minutes with Telegram alerts and a status page. UptimeRobot checks 50 monitors every 5 minutes. A 5-minute gap is the price of free; Logdash Builder drops it to 1 minute for $9 a month.',
      },
      {
        question: 'What should REST API monitoring check?',
        answer:
          'One route that returns 200 with a one-field JSON body when the API can serve requests and 503 when it cannot. Monitors read the status line, not the body, so a 200 carrying an error field is an outage nobody hears about.',
      },
      {
        question: 'How does REST API monitoring measure uptime?',
        answer:
          'Check one route on a fixed interval from outside your infrastructure and count the share of checks that came back 200 to 399. Logdash keeps each check for 12 hours and hourly totals for 90 days, and a public uptime badge shows the result over 24 hours, 7, 30 or 90 days.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'website',
    h1: 'Website uptime monitoring',
    answer:
      'Website uptime monitoring requests your site on a schedule, every 5 minutes on a free plan, and alerts you the moment it answers with an error or stops answering, so you hear about downtime before a visitor emails you.',
    meta: {
      title: 'Website uptime monitoring, free | Logdash',
      description:
        'Free website uptime checks every 5 minutes with a Telegram downtime alert, why monitoring the home page can lie, and when Better Stack is the better pick.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Without a monitor, the usual way to learn a site is down is a message from a customer, an hour in. Uptime monitoring replaces that with a request every few minutes from outside your hosting and an alert on the first bad answer. The gap between failure and alert is the check interval: 5 minutes on the Logdash free plan, 1 minute on Builder, 15 seconds on Pro.',
      },
      { type: 'heading', text: 'What a free 5-minute check is worth' },
      {
        type: 'paragraph',
        text: 'At a 5-minute interval a site gets 288 checks a day, and an outage that starts right after a check goes unnoticed for up to 5 minutes. For a blog or a landing page that is fine. For a checkout it is a support thread, which is the case for Builder at 1 minute or Pro at 15 seconds. Either way the check has to come from outside your hosting. A monitor on the same server as the site goes down with it and tells you nothing.',
      },
      {
        type: 'heading',
        text: 'What website monitoring catches, and what it misses',
      },
      {
        type: 'list',
        items: [
          'Catches: the server answering 5xx, the host refusing connections, a hostname that stops resolving, and no reply within 10 seconds.',
          'Catches: a redirect loop. The check follows up to 5 redirects, so http to https to www is fine and a sixth redirect is down.',
          'Misses: a page that returns 200 but renders blank because a script failed to load. The check reads the status line, not the page.',
          'Misses: wrong text on the page. Logdash has no keyword checks yet.',
          'Misses: a CDN serving a cached 200 while your origin is down. Monitor a route the cache cannot answer.',
        ],
      },
      { type: 'heading', text: 'The catch-all trap' },
      {
        type: 'paragraph',
        text: 'Single-page apps and many hosting setups answer every path with the same HTML and a 200. Check the home page of such a site and you are checking that the host serves a file, not that your app works. The backend can be down for a day while the monitor shows 100%. Run this to see whether your site does it.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `site=https://example.com
home=$(curl -sL --max-time 10 "$site/" | cksum)
fake=$(curl -sL --max-time 10 "$site/no-such-page-$RANDOM" | cksum)

if [ "$home" = "$fake" ]; then
  echo "catch-all: monitor a health route instead of /"
else
  echo "ok: / is a real page"
fi`,
      },
      {
        type: 'paragraph',
        text: 'Logdash runs the same test when you add a URL. It requests your address and a made-up path on the same host, and if the bodies match it warns that the check only proves the host is up. It also tries `/health`, `/api/health` and `/up`, and offers any that answer as a one-click swap.',
      },
      { type: 'heading', text: 'Website downtime alert in three steps' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the site',
            text: 'Paste the URL into Logdash. If the catch-all warning appears, take one of the health routes it offers.',
          },
          {
            title: 'Connect Telegram',
            text: 'Link the Logdash bot to your Telegram chat once. Every monitor in the domain can then alert there, and a webhook can run beside it.',
          },
          {
            title: 'Take the site down',
            text: 'Stop the server or point the route at a 500. On the next check a Telegram message arrives with a red dot, the site name, the status code and the first lines of the error, and a second one when it recovers.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Better Stack',
        them: 'Better Stack',
        rows: [
          {
            feature: 'Free monitors and interval',
            logdash: '5 sites every 5 minutes',
            them: '10 monitors every 3 minutes',
            winner: 'them',
          },
          {
            feature: 'False alarm filter',
            logdash: 'Alerts on the first failed check',
            them: 'Checks from at least 4 locations, opens an incident when 3 fail',
            winner: 'them',
          },
          {
            feature: 'Free alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email and Slack',
            winner: 'tie',
          },
          {
            feature: 'Public status page on the free plan',
            logdash: 'One, custom domain on Pro',
            them: 'One',
            winner: 'tie',
          },
          {
            feature: 'Source code',
            logdash: 'AGPL-3.0, public repository',
            them: 'Closed source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Better Stack',
        reasons: [
          'You run more than five sites and want them all on a free plan with shorter gaps.',
          'A single failed request from one location should not wake you. Their multi-location confirmation filters that out by default.',
          'You also need SSL certificate or domain expiry checks, which Logdash does not have.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How does website uptime monitoring work?',
        answer:
          'A server outside your hosting sends a GET to your URL on a fixed interval. A status from 200 to 399 within 10 seconds counts as up. Anything else counts as down and sends an alert on the first failed check, then another when the site recovers.',
      },
      {
        question: 'What does website monitoring cover beyond uptime?',
        answer:
          'In Logdash, response time on every check, charted per monitor, plus a public status page and uptime badges for 24 hours, 7, 30 and 90 days. It does not check page content, SSL expiry or domain expiry.',
      },
      {
        question: 'Can I get website uptime monitoring free?',
        answer:
          'Yes. The Logdash free plan covers 5 sites checked every 5 minutes, with Telegram or webhook alerts and one public status page. Builder at $9 a month checks every minute, Pro at $15 every 15 seconds.',
      },
      {
        question: 'How do I set up a website downtime alert?',
        answer:
          'Add the URL as a monitor, connect a Telegram chat once, then stop the site to test it. The alert arrives on the first failed check with the status code and the start of the error body.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'webhook',
    h1: 'Webhook monitoring',
    answer:
      'Monitor a webhook receiver with an uptime check on a GET route at the same path, because providers only ever POST to it, and monitor the jobs behind it with a push monitor they call like an inbound webhook, so a missing call becomes an alert.',
    meta: {
      title: 'Webhook monitoring for receivers and workers | Logdash',
      description:
        'Watch a webhook receiver that only accepts POST, get a Telegram alert when it breaks, and use push monitors as inbound webhooks from your workers.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A webhook receiver fails quietly. Stripe retries a failed delivery for up to three days in live mode, so a broken endpoint does not look like an outage. It looks like nothing. You find out when a customer paid and their account never upgraded.',
      },
      {
        type: 'paragraph',
        text: 'The obvious fix does not work as is. Logdash monitors send a plain GET with no body and no custom headers, and a receiver built for a provider only accepts POST. Point a monitor at /webhooks/stripe and it gets a 404 or a 405 on every check and stays red forever. So give the monitor its own door on the same path.',
      },
      { type: 'heading', text: 'Webhook endpoint monitoring' },
      {
        type: 'code',
        language: 'javascript',
        title: 'routes/webhooks.js',
        code: `import express from 'express';
import { pool } from '../db.js';
import { handleStripeEvent } from '../stripe.js';

export const webhooks = express.Router();

// What Stripe calls. Raw body, because the signature check needs it.
webhooks.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeEvent,
);

// What the monitor calls. Same path, same process, same database.
webhooks.get('/webhooks/stripe', async (req, res) => {
  try {
    await pool.query('select 1');
    res.status(200).send('ok');
  } catch {
    res.status(503).send('db');
  }
});`,
      },
      {
        type: 'paragraph',
        text: "Same path on purpose. A router refactor that drops the route, a proxy rule that stops forwarding it, a deploy that never came up: each turns this GET red the moment the POST starts failing. What it cannot see is a rotated signing secret or a provider that stopped sending, because the GET never runs your signature check. The provider's delivery log covers those.",
      },
      { type: 'heading', text: 'Cron webhook monitoring' },
      {
        type: 'paragraph',
        text: 'Push monitors flip the direction. Your code calls `POST https://api.logdash.io/ping/<monitorId>` with no auth header and no body, and the monitor goes down when a check window passes without a call. Push monitors are on Pro, where the window is 15 seconds. That fits a worker or a queue consumer that loops all day. It does not fit a crontab line that runs hourly or nightly, because the monitor would go down 15 seconds after every run. For those, Healthchecks.io or Cronitor, with a cron expression and a grace period per job, are the better tool.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'worker-loop.sh',
        code: `# The ping fires only when a pass succeeds, so a crash or a hang
# reads as a missed window. Keep one pass plus the sleep under 15 s.
while true; do
  /srv/app/bin/drain-queue \\
    && curl -fsS -m 5 -X POST https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234
  sleep 10
done`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the GET route',
            text: 'Ship the GET handler beside the POST handler and open https://yourapp.com/webhooks/stripe in a browser. You should see ok, not a 405.',
          },
          {
            title: 'Create the monitors',
            text: 'Add a monitor with that URL. It checks every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro. A service holds one monitor, so on Pro add a second service with a push monitor for the worker and paste its id into the loop.',
          },
          {
            title: 'Break it on purpose',
            text: 'Connect Telegram, then stop the database. The GET returns 503, the monitor flips to down on the next check, and a Telegram alert names the receiver and shows the 503.',
          },
        ],
      },
      { type: 'heading', text: 'Webhook monitoring tools' },
      {
        type: 'paragraph',
        text: 'An uptime check and a webhook gateway answer different questions. Logdash asks your receiver whether it can take a request. Hookdeck sits in front of it and sees every real delivery.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs Hookdeck',
        them: 'Hookdeck',
        rows: [
          {
            feature: 'Receiver down during a quiet hour',
            logdash: 'Caught on the next check, every 15 seconds on Pro',
            them: 'Seen when the next real event fails to deliver',
            winner: 'logdash',
          },
          {
            feature: 'One failed delivery',
            logdash: 'Invisible while the GET still answers 200',
            them: 'Opens an issue with the payload attached',
            winner: 'them',
          },
          {
            feature: 'Retries',
            logdash: 'None, the provider retries on its own schedule',
            them: 'Automatic retries, plus manual and bulk retries',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook, and that is the list',
            them: 'Email and webhook, Slack and PagerDuty on paid plans',
            winner: 'them',
          },
          {
            feature: 'Change to your stack',
            logdash: 'One GET route',
            them: 'Every provider points at a Hookdeck URL, one more hop',
            winner: 'logdash',
          },
          {
            feature: 'Free tier',
            logdash: '5 monitors, checked every 5 minutes',
            them: '10,000 events a month, 3-day retention',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Hookdeck',
        reasons: [
          'Every event matters. A GET that answers 200 tells you nothing about the one invoice.paid that failed at 02:14.',
          'You want failed events retried after the fix, not only an alert that something broke.',
          'You want the alert in Slack or PagerDuty without writing and hosting the bridge yourself.',
        ],
      },
      { type: 'heading', text: 'Webhook failure alert' },
      {
        type: 'paragraph',
        text: 'Logdash alerts on the transition, once when a monitor goes down and once when it recovers, not on every failed check. Besides Telegram, the webhook channel calls your own URL. On the free plan it sends a GET with no body. On Builder and Pro, set it to POST to receive JSON with httpMonitorId, newStatus, name, url, errorMessage and statusCode.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What are the best webhook monitoring tools?',
        answer:
          'It depends on the question you need answered. Hookdeck sits in the request path, so it sees every delivery and every failure. Logdash checks that the receiver can take a request at all, every 15 seconds on Pro, and adds push monitors for the workers behind it. If each event carries money, the gateway is the one to pick first.',
      },
      {
        question: 'How does cron webhook monitoring work?',
        answer:
          "The job calls a URL when it succeeds, and the monitor alerts when the call does not arrive. In Logdash that is a push monitor on Pro: a POST to the monitor's ping URL inside every 15-second window. Jobs that run hourly or nightly fit Healthchecks.io or Cronitor better.",
      },
      {
        question:
          'How do I set up webhook endpoint monitoring when the endpoint only accepts POST?',
        answer:
          'Add a GET handler on the same path that runs one database query and returns 200 or 503, then point an uptime monitor at it. Logdash monitors only send GET, without a body or headers, so they cannot replay a signed POST.',
      },
      {
        question: 'How do I get a webhook failure alert?',
        answer:
          "For the receiver, an uptime monitor on its GET route sends a Telegram alert when it returns 503 or does not answer within 10 seconds. For a single failed event, read the provider's delivery log or put a gateway such as Hookdeck in front, because an uptime check never sees individual deliveries.",
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'graphql',
    h1: 'GraphQL API monitoring',
    answer:
      'Monitor a GraphQL API through a GET readiness route next to /graphql that runs one database query and returns 503 when it fails, because uptime monitors read the status code and a GraphQL server answers 200 even when a resolver throws.',
    meta: {
      title: 'GraphQL API monitoring with a readiness route | Logdash',
      description:
        'Why /graphql is the wrong URL to monitor, the readiness route that works instead, and a Telegram alert when it returns 503. Code for GraphQL Yoga.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'GraphQL breaks the usual uptime check twice. First the request: queries go out as a POST with a JSON body, and Logdash monitors send a plain GET with no body and no custom headers. Then the answer: when a resolver throws, the server still returns 200 with an errors array next to the data. A monitor that reads the status line, which is all Logdash reads, would stay green through a dead database.',
      },
      {
        type: 'paragraph',
        text: 'So do not monitor /graphql. Monitor a route next to it that fails for the same reason the resolvers would fail, usually the database, with a status code a monitor can read. At 15-second intervals that route runs 5,760 times a day, so keep it to one select 1.',
      },
      { type: 'heading', text: 'GraphQL health check' },
      {
        type: 'paragraph',
        text: 'The usual advice is GET /graphql?query={__typename}. Two problems. Apollo Server 4 and later ship with CSRF prevention switched on, which answers a GET with 400 unless it carries a JSON Content-Type, an x-apollo-operation-name header or an apollo-require-preflight header. Logdash cannot add that header, so the monitor would be red from its first check. And __typename never reaches a resolver or the database, so it proves the process runs and nothing more.',
      },
      {
        type: 'paragraph',
        text: 'GraphQL Yoga does most of this for you. It answers /health with a 200 as a liveness check, and the useReadinessCheck plugin serves /ready, which returns 503 when your check returns false or throws.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'server.ts',
        code: `import { createServer } from 'node:http';
import { createSchema, createYoga, useReadinessCheck } from 'graphql-yoga';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const yoga = createYoga({
  schema: createSchema({
    typeDefs: 'type Query { hello: String }',
    resolvers: { Query: { hello: () => 'world' } },
  }),
  plugins: [
    useReadinessCheck({
      endpoint: '/ready',
      check: async () => {
        try {
          await pool.query('select 1');
          return true; // 200
        } catch {
          return false; // 503, no body
        }
      },
    }),
  ],
});

// /graphql for clients, /ready for the monitor.
createServer(yoga).listen(4000);`,
      },
      {
        type: 'paragraph',
        text: "On Apollo Server with Express, the same idea is an app.get('/ready') handler registered before the GraphQL middleware, running the same select 1 and answering 503 when it throws. Apollo Server 4 and later have no built-in health route, so this one is yours to write.",
      },
      { type: 'heading', text: 'GraphQL uptime monitoring' },
      {
        type: 'steps',
        items: [
          {
            title: 'Ship the readiness route',
            text: 'Deploy the server and open https://api.yourapp.com/ready. A 200 with an empty body is correct.',
          },
          {
            title: 'Point a monitor at it',
            text: 'Add a monitor with that URL. It checks every 5 minutes on the free plan, every minute on Builder and every 15 seconds on Pro, and stores the status code and response time of each check.',
          },
          {
            title: 'Break it on purpose',
            text: 'Connect Telegram and stop the database. /ready returns 503, the monitor flips to down on the next check, and a Telegram alert names the API and shows the 503.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: 'What this does not catch: a resolver bug that only one query hits, or an expired token for the third-party API one field depends on. The server is up, the database answers, and that field returns an error inside a 200. Those are errors, not downtime. Log them from your error handler, or use a tool that sends real queries.',
      },
      { type: 'heading', text: 'GraphQL monitoring with real queries' },
      {
        type: 'comparison',
        title: 'Logdash vs Checkly',
        them: 'Checkly',
        rows: [
          {
            feature: 'Send a GraphQL query as a POST',
            logdash: 'No, a GET with no body or headers',
            them: 'Yes, with a GraphQL body type and custom headers',
            winner: 'them',
          },
          {
            feature: 'Assert on the response body',
            logdash: 'No, status code and response time only',
            them: 'JSON body assertions, so an errors array can fail the check',
            winner: 'them',
          },
          {
            feature: 'Fastest check interval',
            logdash: '15 seconds on Pro',
            them: '1 minute on Hobby and Starter, 30 seconds on Team',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, Slack and webhook on the free plan',
            winner: 'them',
          },
          {
            feature: 'Free plan',
            logdash: '5 monitors, checked every 5 minutes',
            them: '10,000 API check runs a month',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Checkly',
        reasons: [
          'You need to know that a real query returns real data, not only that the server and the database answer.',
          'Your API sits behind auth and the check has to send a token.',
          'A 200 carrying an errors array is the outage you actually worry about.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is GraphQL monitoring?',
        answer:
          'Checking from outside that a GraphQL API can serve queries, and getting an alert when it cannot. Uptime monitoring covers availability through a readiness route. Error tracking covers the 200 responses that carry an errors array, which no status code check can see.',
      },
      {
        question: 'How do I add a GraphQL health check?',
        answer:
          'Expose a GET route next to /graphql that runs select 1 and returns 503 on failure. In GraphQL Yoga that is the useReadinessCheck plugin on /ready. Apollo Server 4 and later have no built-in health route, so add one to the web framework it runs in.',
      },
      {
        question: 'Can I do GraphQL uptime monitoring on /graphql directly?',
        answer:
          'Only with a monitor that can send a POST body or the apollo-require-preflight header. Logdash sends a bare GET, so point it at the readiness route instead. That is the more honest signal anyway, because /graphql answers 200 when a resolver fails.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'database',
    h1: 'Database availability monitoring',
    answer:
      'Logdash cannot connect to a database itself, so you monitor database availability through something that can: an HTTP health route that runs select 1 and returns 503 when it fails, or a push monitor called by a script on a host next to the database.',
    meta: {
      title: 'Database availability monitoring: Postgres, MySQL | Logdash',
      description:
        'No TCP check needed: a SELECT 1 health route or a heartbeat from the database host, with a Telegram alert when Postgres or MySQL stops answering.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Logdash does not open a connection to Postgres or MySQL. Monitors send HTTP GET requests from the public internet, there are no TCP port checks, and private addresses are refused. That sounds like a gap until you look at what a port check proves: that something accepted a TCP handshake on 5432. Not that your app can log in, not that the pool has a free connection, not that a query comes back.',
      },
      {
        type: 'paragraph',
        text: 'Your database should not be reachable from the internet in the first place. So the check goes through something that already holds a connection, and there are two honest ways to do that.',
      },
      { type: 'heading', text: 'Database uptime monitoring through your app' },
      {
        type: 'paragraph',
        text: 'The best signal is a route in your app that runs the cheapest query the database can answer. It fails for the same reasons a user request fails: credentials rotated without a redeploy, an exhausted pool, a failover your DNS has not caught up with, a database that is simply gone.',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'health.js',
        code: `import express from 'express';
import pg from 'pg';

// In a real app, import the pool your handlers use instead.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 2000, // no free connection in 2 s is a failure
  query_timeout: 2000,
});

const app = express();

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('select 1');
    res.status(200).send('ok');
  } catch {
    res.status(503).send('db');
  }
});

app.listen(3000);`,
      },
      {
        type: 'paragraph',
        text: 'Use the pool the handlers use, or the check cannot see that pool running dry. MySQL is the same route with mysql2 and the same query. The 2-second timeouts matter: the Logdash pinger gives up after 10 seconds and records a timeout, but a hung pool should become a 503 you can read, not a timeout you have to guess at.',
      },
      {
        type: 'heading',
        text: 'Postgres uptime monitoring from the database host',
      },
      {
        type: 'paragraph',
        text: 'Some databases have no app in front of them: a reporting replica, a self-hosted Postgres on a VPS, a MySQL box only a nightly export touches. Run a small loop on that host, or one next to it, that queries the database and calls a push monitor when the query succeeds. Push monitors are on Pro and expect a call inside every 15-second window.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'db-heartbeat.sh',
        code: `#!/bin/sh
# Password from ~/.pgpass, -w never prompts for one.
# MySQL: mysql -h 127.0.0.1 -u app -e 'select 1' app
PING=https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234

while true; do
  psql -w -h 127.0.0.1 -U app -d app -tAc 'select 1' > /dev/null 2>&1 \\
    && curl -fsS -m 5 -X POST "$PING" > /dev/null
  sleep 10
done`,
      },
      {
        type: 'paragraph',
        text: 'Query with the credentials your app uses. pg_isready exits 0 without a valid user or password, and mysqladmin ping exits 0 even on Access denied. Both prove the server process answers, which is less than you think you are checking.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Pick the path',
            text: 'Public app in front of the database: ship the /health/db route. No app, or only a private network: run the heartbeat script under systemd, on Pro.',
          },
          {
            title: 'Create the monitor',
            text: 'For the route, add a monitor with https://yourapp.com/health/db, checked every 5 minutes free, every minute on Builder, every 15 seconds on Pro. For the script, add a push monitor and paste its id.',
          },
          {
            title: 'Stop the database',
            text: 'Connect Telegram and stop Postgres or MySQL. The route returns 503, or the pings stop, and a Telegram alert tells you the monitor is down.',
          },
        ],
      },
      { type: 'heading', text: 'MySQL uptime monitoring without code' },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Connect to the database directly',
            logdash: 'No, through a health route or a push heartbeat',
            them: 'PostgreSQL, MySQL/MariaDB, SQL Server, MongoDB and Redis monitors',
            winner: 'them',
          },
          {
            feature: 'TCP port check',
            logdash: 'None',
            them: 'Yes',
            winner: 'them',
          },
          {
            feature: 'Reach a database on a private network',
            logdash: 'Only by push, from a host inside it, on Pro',
            them: 'Directly, when Kuma runs inside that network',
            winner: 'them',
          },
          {
            feature: 'Check the path your users take',
            logdash: 'A health route tests app, pool and database together',
            them: 'Same, with an HTTP monitor on the same route',
            winner: 'tie',
          },
          {
            feature: 'Who watches the monitor',
            logdash: 'Hosted, outside your infrastructure',
            them: 'You run it, and on the database box it dies with the database',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Telegram, Discord, Slack, email and 90+ more',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You already run a box inside the network and want a database check without touching the app.',
          'You need TCP port checks, or Redis and MongoDB monitors as well.',
          'Self-hosting is a requirement. Uptime Kuma runs on your server today, and Logdash self-hosting is not a one-command install yet.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is database availability monitoring?',
        answer:
          "Checking on a schedule that the database accepts connections and answers queries, and alerting when it stops. The useful version runs a real query with your app's credentials, because a server can accept TCP connections and still refuse your app.",
      },
      {
        question:
          'How do I set up database uptime monitoring without exposing the database?',
        answer:
          'Keep the database private and check it through something that already reaches it: an HTTP route in your app that runs select 1, or a script on a nearby host that queries every 10 seconds and pings a push monitor on Pro after each success.',
      },
      {
        question: 'How does postgres uptime monitoring work in Logdash?',
        answer:
          'Through your app or a heartbeat. A /health/db route runs select 1 and returns 503 on failure, checked every 5 minutes free or every 15 seconds on Pro. Or psql in a loop on the host calls a push monitor on Pro. Logdash never connects to port 5432 itself.',
      },
      {
        question: 'Is mysql uptime monitoring any different?',
        answer:
          'Only in the driver. Use mysql2 in the route or the mysql client in the script, with the same select 1. Do not rely on mysqladmin ping, which exits 0 even when the server answers Access denied.',
      },
    ],
    updatedAt: '2026-10-02',
  },
];

export const assets: SeoFamilyData = {
  family: assetsFamily,
  pages: assetsPages,
};
