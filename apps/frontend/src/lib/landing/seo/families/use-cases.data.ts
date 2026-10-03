import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family J. Nobody searches "uptime monitoring for indie hackers", so these pages
 * exist for navigation and for AI answers, not for a query. H1s are natural
 * phrasings and the FAQ holds the questions this reader actually asks.
 *
 * Plan numbers come from the backend plan configs: Hobby is free with 5
 * services at 5-minute checks and 1 status page, Builder is $9 with 20
 * services at 1 minute and 5 status pages, Pro is $15 with 50 services at 15
 * seconds, 15 status pages and custom domains.
 */
export const useCasesFamily: SeoFamily = {
  key: 'use-cases',
  hubPath: '/use-cases',
  hubLabel: 'Who Logdash is for',
  title: 'Uptime monitoring for founders, indie hackers and SaaS | Logdash',
  description:
    'Uptime monitoring for one founder, a pile of side projects, a WordPress store or a SaaS with paying users, with real plan numbers.',
  intro:
    'One page per kind of founder, each with the plan that fits, the setup and the tool to pick instead when it fits better.',
};

export const useCasesPages: SeoPage[] = [
  {
    slug: 'solo-founders',
    h1: 'Uptime monitoring for solo founders',
    answer:
      'Put a free Logdash monitor on the 5 URLs your product cannot live without, connect Telegram, and you hear about an outage within 5 minutes instead of from a customer, with no server of your own to keep alive.',
    meta: {
      title: 'Uptime monitoring for solo founders | Logdash',
      description:
        'Five services checked every 5 minutes for free, Telegram alerts and a public status page, then 15-second checks for $15 a month once the product earns it.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'When you are the whole company, you are also the on-call rotation, the support desk and the person who finds out last. Users of a small product rarely email to say it is broken. They close the tab, and the next morning you see a dip in signups and no idea why. The job of a monitor here is narrow: notice before they do, and put it on the phone you already carry.',
      },
      {
        type: 'paragraph',
        text: 'The free Hobby plan covers 5 services with one HTTP monitor each, checked every 5 minutes, plus 1 public status page and alerts on Telegram or a webhook. For most one-person products that is the entire surface. Nothing to install, and it runs on infrastructure that is not yours, so it keeps watching on the night your server does not.',
      },
      { type: 'heading', text: 'What to put the 5 monitors on' },
      {
        type: 'list',
        items: [
          'The app health endpoint, one that runs a database query. A landing page on a CDN stays up while the app behind it is down.',
          'The API, if it lives on its own host or region.',
          'The landing page, because a DNS change or a lapsed hosting bill takes it down without touching the app.',
          'Anything a customer pays for that has its own URL, like a docs site or the host that serves your embed script.',
          'Then stop. A monitor on something nobody would miss is an alert you learn to ignore.',
        ],
      },
      { type: 'heading', text: 'Check it the way the monitor will' },
      {
        type: 'paragraph',
        text: 'Logdash sends a GET, follows up to 5 redirects, gives up after 10 seconds and counts any final status from 200 to 399 as up. This curl does the same, so run it before you add the monitor and you will not be surprised by the first result.',
      },
      {
        type: 'code',
        language: 'bash',
        code: `curl -sL --max-redirs 5 --max-time 10 -o /dev/null \\
  -w '%{http_code} in %{time_total}s\\n' \\
  https://yourapp.com/health`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add your URLs',
            text: 'Create a service per URL and paste the address. The first check runs a second after you save, so a typo shows up now rather than during an outage.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add @logdash_uptime_bot to a Telegram chat and send it the passphrase Logdash shows you, then tick that chat on each monitor. One chat can carry every monitor in the domain.',
          },
          {
            title: 'Break one on purpose',
            text: 'Point a monitor at a path that returns 404 and wait one interval. A Telegram message arrives saying the service is down, with the status code and the error, and a second one says it is up when you fix the path.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs UptimeRobot for one founder',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Free monitors',
            logdash: '5 services, one monitor each',
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
            feature: 'Telegram alerts',
            logdash: 'On the free plan',
            them: 'From the paid Solo plan',
            winner: 'logdash',
          },
          {
            feature: 'Monitor types',
            logdash: 'HTTP only',
            them: 'HTTP, keyword, ping and port',
            winner: 'them',
          },
          {
            feature: 'Faster checks',
            logdash: '15 seconds for $15 a month',
            them: '60 seconds on Solo, about €10 a month',
            winner: 'logdash',
          },
          {
            feature: 'App logs and metrics',
            logdash: 'Same service, eight SDKs',
            them: 'Not part of the product',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'You have more than 5 things to watch and no budget. 50 free monitors beats 5 every time.',
          'You want alerts by email or SMS. Logdash sends Telegram messages and webhooks, nothing else.',
          'You need keyword, ping or port checks. Logdash only makes HTTP requests.',
        ],
      },
      { type: 'heading', text: 'When to pay' },
      {
        type: 'paragraph',
        text: 'Builder is $9 a month for 20 services checked every minute. Pro is $15 a month for 50 services checked every 15 seconds, 15 status pages and a custom domain on them. The rule of thumb: pay when 5 minutes of downtime costs you more than $15. For a product with its first paying users, that day comes sooner than you think. Plans are priced per account, not per seat.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question:
          'What is the cheapest way to monitor uptime as a solo founder?',
        answer:
          'A hosted free plan. Logdash Hobby watches 5 services every 5 minutes with Telegram alerts for $0, and a monitor on someone else’s infrastructure costs less than the evening you would spend running your own.',
      },
      {
        question: 'How many sites can I monitor for free?',
        answer:
          '5 services on the Hobby plan, with one HTTP monitor each. Builder raises that to 20 for $9 a month and Pro to 50 for $15.',
      },
      {
        question:
          'Do I need a status page if I am the only person on the team?',
        answer:
          'Yes, mostly for you. During an outage it answers the "is it just me" emails, so you can fix the problem instead of replying. The free plan includes one.',
      },
      {
        question: 'Will it wake me up at night?',
        answer:
          'Only as loudly as Telegram does. Logdash does not phone you, so if you need a call, route the webhook into a service that makes one, or allow Telegram through Do Not Disturb and give the alert chat its own sound.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'indie-hackers',
    h1: 'Uptime monitoring for indie hackers',
    answer:
      'Logdash watches your side projects from outside your VPS, 5 of them for free and 50 for $15 a month, sends Telegram alerts and gives you a public uptime number you can post while you build in public.',
    meta: {
      title: 'Uptime monitoring for indie hackers | Logdash',
      description:
        'Hosted uptime checks for every side project, Telegram alerts, and a status API to show live uptime on your landing page. Free for 5 projects.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'The indie portfolio has a shape. Three projects earn money, four earn nothing yet, two are dead but still online, and most of them share one VPS running Coolify or a pile of Docker containers. You ship on Saturday, move on to the next idea on Sunday, and the thing you shipped keeps running without anyone looking at it.',
      },
      {
        type: 'paragraph',
        text: 'The usual answer is Uptime Kuma in one more container on the same box. It is free and good software. The catch is that the monitor now shares a fate with everything it watches. When the VPS runs out of disk or the provider has a bad night, Kuma goes quiet together with your apps, and the first alert you get is a reply to your launch tweet.',
      },
      {
        type: 'paragraph',
        text: 'Logdash runs the checks from outside your stack. The free plan covers 5 services every 5 minutes, enough for the projects that earn. Pro at $15 a month covers 50 services every 15 seconds, which is the whole graveyard plus room for the next ten ideas.',
      },
      { type: 'heading', text: 'Show your uptime while you build in public' },
      {
        type: 'paragraph',
        text: 'Every published status page is also public JSON, so you can put a live uptime line on your landing page without an API key. The typed client is one install, npm i @logdash/status, and the snippet below runs on your server.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'status-line.ts',
        code: `import { fetchStatusPage } from '@logdash/status';

// Public endpoint, no API key. Responses are cached for 60 seconds.
export async function statusLine(): Promise<string> {
  const page = await fetchStatusPage('your-status-page-id');

  if (page.status === 'unknown') return 'No checks yet';
  if (page.status !== 'operational') return 'Some systems are down';

  const uptime = page.monitors[0]?.uptime['30d'];

  return uptime == null
    ? 'All systems up'
    : \`All systems up, \${uptime.toFixed(2)}% over 30 days\`;
}`,
      },
      {
        type: 'paragraph',
        text: 'For a README or a launch page, every monitor on a published status page also has an uptime badge, an SVG you embed like any image. Three styles, classic, status and card, four periods from 24 hours to 90 days, light or dark. Badges are cached for 60 seconds, so launch day traffic does not matter.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'One service per project',
            text: 'Add each project as a service and paste its health URL. The status code and response time of every check are kept, so you see which project got slow after last week’s deploy.',
          },
          {
            title: 'Connect Telegram, publish the page',
            text: 'Add @logdash_uptime_bot to a Telegram chat and send it the passphrase. Then publish a status page with the monitors you want public, which also gives you the JSON the snippet reads.',
          },
          {
            title: 'Pull the plug',
            text: 'Stop one container and wait one interval. Telegram tells you the project is down, with the status code or the timeout, and again when it is back up.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma on your VPS',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Survives your VPS going down',
            logdash: 'Yes, runs outside your stack',
            them: 'No, if it shares the box',
            winner: 'logdash',
          },
          {
            feature: 'Cost',
            logdash: 'Free for 5, $15 a month for 50',
            them: 'Free, unlimited monitors',
            winner: 'them',
          },
          {
            feature: 'Monitor types',
            logdash: 'HTTP checks',
            them: 'HTTP, TCP, ping, DNS, keyword, Docker and more',
            winner: 'them',
          },
          {
            feature: 'Notification channels',
            logdash: 'Telegram and webhook',
            them: '90+ providers',
            winner: 'them',
          },
          {
            feature: 'Public status page',
            logdash: 'Hosted, plus a JSON API',
            them: 'Built in, served from your box',
            winner: 'tie',
          },
          {
            feature: 'Maintenance',
            logdash: 'None',
            them: 'Container updates and backups',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You have a second box, on a different provider from your apps. Kuma there gets you outside monitoring with unlimited monitors for the price of the box.',
          'You need TCP, DNS or Docker container checks. Logdash only makes HTTP requests.',
          'You want Discord, Slack or email alerts. Kuma has them built in and Logdash does not.',
        ],
      },
      { type: 'heading', text: 'What to do with dead projects' },
      {
        type: 'paragraph',
        text: 'Keep a monitor on a dead project only while its domain still points at something. The day you let the domain lapse, delete the service. It frees the slot for the next idea, and a monitor that has been red for a month teaches you to ignore red.',
      },
      {
        type: 'paragraph',
        text: 'When a live project does break, the same service also takes logs and metrics from the app through eight SDKs, kept for 24 hours on the free plan, so the 2am alert sits next to the log line that explains it.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Can I monitor all my side projects for free?',
        answer:
          'Five of them. Hobby covers 5 services checked every 5 minutes. Past that, Builder is $9 a month for 20 and Pro is $15 for 50.',
      },
      {
        question: 'Should I just run Uptime Kuma on my VPS?',
        answer:
          'On a separate box from your apps, it is a fine choice. On the same box, it goes down with the apps it is supposed to warn you about, which is the one failure a monitor exists to catch.',
      },
      {
        question: 'Can I show my uptime publicly while I build in public?',
        answer:
          'Yes. Every published status page is also public JSON with 1-hour to 90-day uptime per monitor, and there are uptime badges for a README or a landing page.',
      },
      {
        question: 'Does Logdash work with Coolify or Docker?',
        answer:
          'It does not care what runs the app. It makes an HTTP request to a public URL, so anything Coolify or Docker exposes on a domain can be monitored.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'wordpress-sites',
    h1: 'Uptime monitoring for WordPress sites',
    answer:
      'Monitor the paths that take the money, not the homepage: a health route that fails when WooCommerce is off or wp-cron and the renewal queue fall an hour behind, plus the Store API your checkout calls, each checked from outside with a Telegram alert.',
    meta: {
      title: 'Uptime monitoring for WordPress stores and renewals | Logdash',
      description:
        'Catch a stalled wp-cron, stuck subscription renewals and a broken checkout on a WooCommerce, membership or booking site, with one health route and Telegram alerts.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A WordPress business earns its money on paths the homepage never touches: the checkout, the member login, the booking form, and the jobs that run with nobody watching, like subscription renewals, membership expiry and reminder emails. A homepage check sees none of that, and a page cache keeps it green while all of it fails.',
      },
      {
        type: 'paragraph',
        text: 'Three failures cost a store the most, and none of them changes the status code of the homepage.',
      },
      {
        type: 'list',
        items: [
          'wp-cron stops. WordPress runs scheduled events only when PHP serves a request, and a cached page does not count. Set DISABLE_WP_CRON without adding a server cron, or let a firewall block the loopback request, and nothing scheduled runs again.',
          'The renewal queue stalls. WooCommerce Subscriptions charges renewals through Action Scheduler, which runs off wp-cron once a minute. When cron stops, renewal orders stop, and every subscription still says Active.',
          'A night-time auto-update breaks checkout. Since WordPress 6.6, a plugin auto-update that throws a fatal error on the homepage is rolled back. One that breaks only checkout or login stays installed, and theme updates have no rollback at all.',
        ],
      },
      { type: 'heading', text: 'A health route that knows about the money' },
      {
        type: 'code',
        language: 'php',
        title: 'wp-content/mu-plugins/shop-health.php',
        code: `<?php
add_action('rest_api_init', function () {
    register_rest_route('shop/v1', '/health', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {
            $hourAgo = time() - HOUR_IN_SECONDS;
            $failing = [];

            if (!class_exists('WooCommerce')) {
                $failing[] = 'woocommerce inactive';
            }

            $oldestDue = array_key_first(wp_get_ready_cron_jobs());
            if ($oldestDue !== null && $oldestDue < $hourAgo) {
                $failing[] = 'wp-cron an hour behind';
            }

            $lateActions = function_exists('as_get_scheduled_actions')
                ? as_get_scheduled_actions([
                    'status' => 'pending',
                    'date' => $hourAgo,
                    'date_compare' => '<',
                    'per_page' => 1,
                ], 'ids')
                : [];
            if ($lateActions) {
                $failing[] = 'scheduled actions an hour behind';
            }

            $response = new WP_REST_Response(
                ['failing' => $failing],
                $failing ? 503 : 200
            );
            $response->header('Cache-Control', 'no-store');
            return $response;
        },
    ]);
});`,
      },
      {
        type: 'paragraph',
        text: 'Must-use plugins load on every request and have no Deactivate link. The route answers 200 with an empty list, or 503 with the names of what failed. Logdash puts the response body into the Telegram alert, so the message says wp-cron an hour behind, not only 503. On a membership or booking site, swap WooCommerce for the class of the plugin that takes the payments.',
      },
      { type: 'heading', text: 'Three URLs worth watching' },
      {
        type: 'list',
        items: [
          'The health route, at /wp-json/shop/v1/health.',
          'The Store API, at /wp-json/wc/store/v1/products?per_page=1. It is public, needs no key, and is the same API the Cart and Checkout blocks call.',
          'The homepage, for DNS and hosting failures that happen before WordPress runs at all.',
        ],
      },
      {
        type: 'paragraph',
        text: 'That is 3 services, so the free Hobby plan covers them with checks every 5 minutes. A store that takes orders at night is worth Builder at $9 a month for 1-minute checks, or Pro at $15 for every 15 seconds. Each check is also an uncached PHP request, which nudges wp-cron on a quiet site. If the route still reports cron behind, something blocks the loopback.',
      },
      {
        type: 'paragraph',
        text: 'Why not a heartbeat for wp-cron? Logdash push monitors are Pro only and expect a ping every 15 seconds, with no schedule and no grace period. That fits a worker loop, not an hourly job. The health route turns a late job into a status code that a normal check reads, on every plan.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Install the route',
            text: 'Upload shop-health.php to wp-content/mu-plugins and open /wp-json/shop/v1/health. You should see {"failing":[]}.',
          },
          {
            title: 'Add three monitors and Telegram',
            text: 'Create a service each for the health route, the Store API and the homepage. Add @logdash_uptime_bot to a Telegram chat, send it the passphrase and tick that chat on all three.',
          },
          {
            title: 'Switch WooCommerce off on staging',
            text: 'On a public staging copy, deactivate WooCommerce. The next check gets a 503, and a Telegram alert reaches you naming the health route, with woocommerce inactive in the message.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs UptimeRobot for a WordPress store',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Free monitors',
            logdash: '5 services',
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
            feature: '1-minute checks',
            logdash: '$9 a month on Builder, 20 services',
            them: '€10 a month on Solo, 10 monitors',
            winner: 'logdash',
          },
          {
            feature: 'Fastest interval',
            logdash: '15 seconds for $15 a month',
            them: '30 seconds for €41 a month on Team',
            winner: 'logdash',
          },
          {
            feature: 'Page must contain "Add to cart"',
            logdash: 'No, status code only',
            them: 'Keyword checks on every plan',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook, free',
            them: 'Email free, Telegram and SMS from Solo',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'You would rather check that a product page still shows Add to cart than install a PHP file. Keyword checks do that on the free plan.',
          'You want alerts by email or SMS. Logdash sends Telegram messages and webhooks only.',
          'You want more than 5 URLs watched for free.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question:
          'Why are my WooCommerce subscription renewals not processing?',
        answer:
          'Most often because wp-cron stopped. Renewals are Action Scheduler actions that run off wp-cron, so when cron stalls they sit as pending under WooCommerce, Status, Scheduled Actions while the subscription stays Active. The health route above turns that into a 503 within the hour.',
      },
      {
        question: 'Does wp-cron run if nobody visits the site?',
        answer:
          'No. It runs when PHP serves a request, and a cached page does not count. An uncached monitor check counts, and a server cron that calls wp-cron.php every few minutes is the reliable fix.',
      },
      {
        question: 'Can a plugin auto-update take down my WordPress site?',
        answer:
          'Yes. Since WordPress 6.6, a plugin auto-update that causes a fatal error on the homepage is rolled back. An update that breaks only checkout or login stays installed, and theme auto-updates have no rollback.',
      },
      {
        question: 'How often should I check my WooCommerce store?',
        answer:
          'Every minute once it takes orders while you sleep. Builder does that for $9 a month across 20 services, and the free plan checks every 5 minutes.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'saas',
    h1: 'Uptime monitoring for SaaS',
    answer:
      'A SaaS needs checks on the app, the API and the login path every 15 seconds, alerts that reach whoever is on call, and a status page customers can read, which Logdash Pro gives you for $15 a month flat.',
    meta: {
      title: 'Uptime monitoring for SaaS | Logdash',
      description:
        '15-second checks on 50 services, Telegram and webhook alerts, a status page on your own domain and a status API, for $15 a month with no per-seat pricing.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Once customers pay, downtime has a price and a paper trail. They notice inside a minute, some of them have an uptime number in the contract, and the support inbox fills before your phone buzzes. A 5-minute check interval means up to 5 minutes of that before you even know.',
      },
      {
        type: 'paragraph',
        text: 'Logdash Pro checks up to 50 services every 15 seconds for $15 a month, with no per-seat pricing. Every check records the status code and the response time, and hourly averages stay for 90 days, so the slow week before an outage is on the same chart as the outage. Status pages take your own domain, and every page is also public JSON for building it into your app.',
      },
      { type: 'heading', text: 'What to monitor' },
      {
        type: 'list',
        items: [
          'The app health route, running one database query. It catches a dead pool behind a live process.',
          'The public API, on its own monitor, because API customers find out from their own error logs.',
          'The login page or auth callback host, since a broken login looks like a full outage to every user.',
          'The marketing site, separately, because it often runs on a different host and fails for different reasons.',
          'Not Stripe, not your email provider. Their outages are real, but an alert at 3am about someone else’s status page is one you cannot act on.',
        ],
      },
      { type: 'heading', text: 'Route alerts into your own tooling' },
      {
        type: 'paragraph',
        text: 'Telegram covers the founder phone. For everything else there is the webhook channel. On Builder or Pro, set its method to POST and Logdash sends a JSON body on every change between up and down. On the free plan it is a bare GET with no body. Put a secret in the URL so only Logdash can call it.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'logdash-webhook.ts',
        code: `import express from 'express';

type LogdashAlert = {
  httpMonitorId: string;
  newStatus: 'up' | 'down';
  name: string;
  url: string;
  statusCode: string;
  errorMessage?: string;
};

const app = express();
const key = process.env.LOGDASH_WEBHOOK_KEY;

app.post('/hooks/logdash', express.json(), (req, res) => {
  if (!key || req.query.key !== key) {
    res.sendStatus(401);
    return;
  }

  const alert = req.body as LogdashAlert;
  // Open an incident, pause the onboarding emails, post in the team channel.
  console.log(\`\${alert.name} is \${alert.newStatus} (\${alert.statusCode})\`);
  res.sendStatus(204);
});

app.listen(3000);`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the four monitors',
            text: 'One service per surface from the list above. The first check runs a second after you save.',
          },
          {
            title: 'Connect Telegram and the webhook',
            text: 'Add @logdash_uptime_bot to the team chat and send it the passphrase, then add the webhook above as a second channel on every monitor.',
          },
          {
            title: 'Fail a deploy on staging',
            text: 'Ship a build that returns 503 from the health route. Within 15 seconds the webhook fires and Telegram tells you which service went down and with which status code.',
          },
        ],
      },
      { type: 'heading', text: 'Response time is the early warning' },
      {
        type: 'paragraph',
        text: 'Most SaaS outages are not a clean switch from up to down. The database gets slow, then the pool fills, then requests time out. Every check keeps its response time, so the climb from 200 ms to 4 seconds is on the chart before the first failed check. Anything that does not answer within 10 seconds counts as down.',
      },
      { type: 'heading', text: 'Keep the status page off your stack' },
      {
        type: 'paragraph',
        text: 'Publish the status page on status.yourdomain.com with a CNAME to statuspage.logdash.io, not to the app host. A status page that shares servers or deploys with the app goes down with it. If you want status inside the app instead, every page is public JSON, with a typed client and a React or Svelte component that takes your Tailwind theme.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs Better Stack for a small SaaS',
        them: 'Better Stack',
        rows: [
          {
            feature: 'Free tier',
            logdash: '5 services at 5 minutes',
            them: '10 monitors at 3 minutes',
            winner: 'them',
          },
          {
            feature: 'Paid pricing',
            logdash: '$15 a month flat',
            them: 'About $29 to $34 per responder a month',
            winner: 'logdash',
          },
          {
            feature: 'Fastest interval',
            logdash: '15 seconds',
            them: '30 seconds',
            winner: 'logdash',
          },
          {
            feature: 'On-call and escalation',
            logdash: 'Not built',
            them: 'Schedules, escalation, phone and SMS',
            winner: 'them',
          },
          {
            feature: 'Status page',
            logdash: 'Hosted, custom domain, JSON API',
            them: 'Hosted, custom domain',
            winner: 'tie',
          },
          {
            feature: 'App logs and metrics',
            logdash: 'Same service, eight SDKs',
            them: 'Separate log and metrics products',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Better Stack',
        reasons: [
          'You run an on-call rotation with two or more people and need escalation when the first one does not answer.',
          'You need a phone call that wakes you up. Logdash sends Telegram messages and webhooks.',
          'Enterprise customers ask for incident timelines and postmortems in the same tool as the alert.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How often should a SaaS check its uptime?',
        answer:
          'Every 15 to 60 seconds once you have paying customers. Logdash Builder checks every minute for $9 a month and Pro every 15 seconds for $15.',
      },
      {
        question: 'Does a SaaS need a public status page?',
        answer:
          'Yes, as soon as customers pay. It cuts the "is it down" tickets during an outage and gives you a public record of uptime when a customer asks.',
      },
      {
        question: 'Can I send downtime alerts into my own tools?',
        answer:
          'Yes. On Builder or Pro, the webhook channel sends the monitor name, URL, new status, status code and error to any URL when you set its method to POST. The free plan webhook is a GET with no body.',
      },
      {
        question: 'Is Logdash enough on its own for a SaaS?',
        answer:
          'For uptime, response times, alerts and the status page, yes. For an on-call rotation with phone calls and escalation, pair it with a pager tool or pick Better Stack.',
      },
    ],
    updatedAt: '2026-10-02',
  },
];

export const useCases: SeoFamilyData = {
  family: useCasesFamily,
  pages: useCasesPages,
};
