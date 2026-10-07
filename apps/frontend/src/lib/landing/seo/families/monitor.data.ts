import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family B. The intent is "my app runs on X, how do I know when it is down",
 * so every page starts with what the platform already watches, names the gap
 * honestly, and only then points an outside monitor at it.
 *
 * Pages sit in groups (PaaS, edge and backend, servers, home, site builders)
 * because the three sibling links are the next three in array order.
 */
export const platformsFamily: SeoFamily = {
  key: 'monitor',
  hubPath: '/monitor',
  hubLabel: 'All platforms',
  title: 'Uptime monitoring for every platform | Logdash',
  description:
    'What Vercel, Railway, Render, Fly.io, Cloudflare, Supabase, Hetzner and 7 more platforms watch for you, what they miss, and the outside check that covers it.',
  intro:
    'One page per platform, each with what it already monitors, the gap, and a Telegram alert in three steps.',
};

export const platformsPages: SeoPage[] = [
  {
    slug: 'vercel',
    h1: 'Vercel uptime monitoring',
    answer:
      'Vercel does not request your production domain from outside on any plan, so uptime monitoring on Vercel means a health route that cannot be cached plus an external monitor that calls it every few minutes and alerts you when it stops answering 200.',
    meta: {
      title: 'Vercel uptime monitoring | Logdash',
      description:
        'Vercel has no outside-in uptime checks on any plan and its 99.99% SLA is Enterprise only. An uncached health route, a monitor and a Telegram alert in 3 steps.',
    },
    blocks: [
      { type: 'heading', text: 'What Vercel gives you' },
      {
        type: 'paragraph',
        text: 'Vercel sees every request that reaches it. Observability shows function errors and latency per route, and on Pro with Observability Plus you can add alert rules for error anomalies and usage anomalies, measured over 5-minute windows and sent by email, Slack or webhook. Failed deploys get a notification too. Hobby has no alert rules at all.',
      },
      {
        type: 'paragraph',
        text: 'All of it is measured from the inside, on traffic that already arrived. An anomaly needs a baseline and a minimum amount of activity before it fires, and Vercel sets those thresholds for you. A side project at 3am has neither. If the domain stops resolving, the database credentials expire, or the one route that matters starts returning 500 to the four people using it, nothing at Vercel requests your site on a schedule and notices.',
      },
      { type: 'heading', text: 'Vercel SLA and uptime guarantee' },
      {
        type: 'paragraph',
        text: 'Vercel publishes a 99.99% uptime SLA for Enterprise customers. Hobby and Pro have no contractual uptime guarantee. 99.99% allows about 4 minutes 23 seconds of downtime a month. Below it, the credit is 10% of the monthly fee down to 99.1%, 25% from 99% to 95%, and 50% under 95%, capped at half the bill and claimed within 30 days with a record of when the downtime happened. The SLA covers the platform serving your content, not the API or the CLI. An SLA is a refund policy. It does not tell you anything is down.',
      },
      { type: 'heading', text: 'A health route Vercel cannot cache' },
      {
        type: 'code',
        language: 'typescript',
        title: 'app/api/health/route.ts',
        code: `import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Run on every request, never from the build or the CDN.
export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };

  try {
    await sql\`select 1\`;
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ ok: false, error: 'db' }, { status: 503, headers });
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'force-dynamic keeps the route out of the build output and no-store keeps it out of the CDN, so every check reaches a function and the database. Request it twice with curl -sI and the x-vercel-cache header should never read HIT. A cached 200 is a monitor that stays green through the whole outage.',
      },
      {
        type: 'paragraph',
        text: 'Point the monitor at your production domain, not a generated deployment URL like my-app-abc123.vercel.app. Standard Protection puts those behind Vercel Authentication, so a monitor aimed there checks the login wall instead of your app.',
      },
      { type: 'heading', text: 'Three steps to an alert' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and give it https://yourapp.com/api/health. Five monitors fit in the free plan, and every check records the status code and the response time.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Any status outside 200 to 399, or no answer within 10 seconds, counts as down.',
          },
          {
            title: 'Break it on purpose',
            text: 'Change the password inside DATABASE_URL in the project settings and redeploy. The route returns 503, the next check flips the monitor to down, and a Telegram alert lands with the monitor name, the status code and the error. Put the password back and a second message tells you it is up.',
          },
        ],
      },
      { type: 'heading', text: 'Vercel uptime monitoring with Uptime Kuma' },
      {
        type: 'paragraph',
        text: 'Uptime Kuma cannot run on Vercel. It is a long-running Node process that keeps its SQLite database in a persistent data directory, and Vercel functions start per request with no disk that survives. Kuma for a Vercel app means a VPS or a container somewhere else, which is a second machine to update and keep alive.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs Vercel built-in alerts',
        them: 'Vercel alerts',
        rows: [
          {
            feature: 'Requests your domain from outside',
            logdash: 'A GET every 5 minutes, 1 minute or 15 seconds by plan',
            them: 'No, measures traffic that already arrived',
            winner: 'logdash',
          },
          {
            feature: 'Notices a dead app with no traffic',
            logdash: 'Yes, the check is the traffic',
            them: 'No baseline, so no anomaly',
            winner: 'logdash',
          },
          {
            feature: 'Coverage across routes',
            logdash: 'One URL per monitor',
            them: 'Every route, 5xx by default, 4xx optional',
            winner: 'them',
          },
          {
            feature: 'Plan needed',
            logdash: 'Free plan, five monitors',
            them: 'Pro with Observability Plus',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, Slack and webhook',
            winner: 'them',
          },
          {
            feature: 'Setup',
            logdash: 'A URL and a Telegram chat',
            them: 'A rule in team settings',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Vercel alerts',
        reasons: [
          'You are already on Pro with Observability Plus and your traffic is steady. Anomaly rules watch every route, a monitor watches one URL.',
          'Your team lives in Slack or email. Logdash sends Telegram messages and webhooks, nothing else.',
          'You want the alert to arrive with the logs around it. Vercel Agent Investigation, in beta, summarises them for you.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there built-in Vercel uptime monitoring?',
        answer:
          'No. Vercel has error and usage anomaly alerts on Pro with Observability Plus, but nothing on any plan requests your domain on a schedule. Uptime monitoring on Vercel needs an external checker pointed at a route like /api/health.',
      },
      {
        question: 'Can I run Uptime Kuma on Vercel?',
        answer:
          'No. Kuma needs a process that stays up and a persistent data directory for its database, and Vercel functions have neither. Run Kuma on a VPS or another platform, or use a hosted monitor so there is nothing to keep alive.',
      },
      {
        question: 'What is the Vercel SLA?',
        answer:
          '99.99% monthly uptime, Enterprise only, with service credits of 10%, 25% or 50% of the monthly fee depending on how far it falls short, capped at 50% and claimed within 30 days. It excludes the API, the CLI and anything that does not serve your content.',
      },
      {
        question: 'Does Vercel have an uptime guarantee on Hobby or Pro?',
        answer:
          'No. The uptime guarantee is part of the Enterprise contract and is not sold as an add-on. On Hobby and Pro an outage earns no credit, so your own check history is the only record you will have of it.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'railway',
    h1: 'Railway uptime monitoring',
    answer:
      'Railway calls your healthcheckPath only while a new deploy goes live and never after, so uptime monitoring on Railway means an external monitor that requests your public domain every few minutes and alerts you when it fails.',
    meta: {
      title: 'Railway uptime monitoring | Logdash',
      description:
        'Railway healthchecks only gate deploys. The railway.json, a health route on PORT, and an outside monitor that sends a Telegram alert in 3 steps.',
    },
    blocks: [
      { type: 'heading', text: 'What Railway gives you' },
      {
        type: 'list',
        items: [
          'A deploy healthcheck. Railway calls healthcheckPath until it gets any 2xx, for up to 300 seconds by default, and marks the deploy failed if it never does. The old deploy keeps serving.',
          'A restart policy, ON_FAILURE, ALWAYS or NEVER, which acts when the process exits.',
          'Project webhooks on every deploy state change, including Failed and Crashed.',
          'Monitors on the Observability dashboard that alert on CPU, RAM, disk or egress thresholds by email, in-app or webhook. They need the Pro plan.',
        ],
      },
      {
        type: 'paragraph',
        text: "The healthcheck is the one people mistake for monitoring, and Railway says plainly that it does not monitor the endpoint after the deployment has gone live. A process that is up and returning 500 to every request has not crashed, so nothing restarts and no webhook fires. The same goes for a custom domain that stopped resolving or a database that went away. Railway's own docs send you to the Uptime Kuma template for continuous checks.",
      },
      { type: 'heading', text: 'The config and the route' },
      {
        type: 'code',
        language: 'json',
        title: 'railway.json',
        code: `{
  "$schema": "https://railway.com/railway.schema.json",
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE"
  }
}`,
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'server.js',
        code: `const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 3000,
});
const app = express();

app.get('/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: 'db' });
  }
});

app.listen(process.env.PORT || 3000, '0.0.0.0');`,
      },
      {
        type: 'paragraph',
        text: 'Listen on PORT, because Railway injects it and uses the same value for the deploy healthcheck. That check arrives with the hostname healthcheck.railway.app, so if your app only answers allowlisted hosts, add it or every deploy fails. The same route then serves the deploy gate and the outside monitor. A healthcheckTimeout of 120 seconds is plenty for most apps; the 300-second default only makes a broken deploy take longer to fail.',
      },
      { type: 'heading', text: 'Railway uptime with Serverless on' },
      {
        type: 'paragraph',
        text: 'Serverless puts a service to sleep once it has sent no outbound traffic for 5 to 10 minutes. Answering a request from the internet counts as activity, so a monitor that checks every minute keeps the service awake for good and Serverless saves you nothing. At the 5-minute free interval it can fall asleep between checks, and Railway warns that the first request to a sleeping service may get a 502, which Logdash records as down. Turn Serverless off on any service you monitor.',
      },
      { type: 'heading', text: 'Three steps to an alert' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the public domain',
            text: 'Add a monitor in Logdash and give it https://yourapp.up.railway.app/health, or your custom domain. Private network addresses are not reachable from outside, so it has to be the public one.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Each check stores the status code and the response time.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the database under the running deploy. Do not test with a broken deploy: the healthcheck would reject it and keep the old one serving, which is the gate doing its job. The route returns 503, the next check flips the monitor to down, and a Telegram alert arrives with the status code and the error.',
          },
        ],
      },
      { type: 'heading', text: 'Railway Uptime Kuma or a hosted monitor' },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma on Railway',
        them: 'Uptime Kuma on Railway',
        rows: [
          {
            feature: 'Where it runs',
            logdash: 'Outside Railway',
            them: 'A Railway service next to your app',
            winner: 'logdash',
          },
          {
            feature: 'Monitor types',
            logdash: 'HTTP checks, push heartbeats on Pro',
            them: 'HTTP, keyword, TCP, ping, DNS, Docker and more',
            winner: 'them',
          },
          {
            feature: 'Reaches the private network',
            logdash: 'No, public URLs only',
            them: 'Yes, anything the project can reach',
            winner: 'them',
          },
          {
            feature: 'Fastest interval',
            logdash: '15 seconds on Pro',
            them: '20 seconds, on your usage bill',
            winner: 'tie',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'More than 90 providers',
            winner: 'them',
          },
          {
            feature: 'Upkeep',
            logdash: 'None',
            them: 'Volume at /app/data, image updates, backups',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma on Railway',
        reasons: [
          'You need to check services on the private network that have no public domain.',
          'You need TCP, DNS or keyword checks, or alerts in Slack, Discord or email. Logdash has HTTP, heartbeats, Telegram and webhooks.',
          'You want the history in your own SQLite file. Attach the volume at /app/data before you create the admin account.',
          'The catch: a Railway routing incident takes your app and your monitor down together. Many teams run Kuma inside and one free outside check as well.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How do I check Railway uptime?',
        answer:
          'For the platform, status.railway.com lists incidents with wide user impact. For your own service, Railway keeps no uptime figure after a deploy goes live, so an external monitor on your public domain is what records it.',
      },
      {
        question: 'Should I use Railway Uptime Kuma or a hosted monitor?',
        answer:
          'Kuma on Railway is one template and a volume, and it can reach the private network. A hosted monitor keeps alerting when Railway itself has a bad hour. If uptime matters, have at least one check that does not run on Railway.',
      },
      {
        question: 'Does the Railway healthcheck do uptime monitoring?',
        answer:
          'No. It runs only while a deploy goes live, to decide whether to switch traffic over. After that Railway does not call the endpoint again, so a broken but running app stays broken until someone notices.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'render',
    h1: 'Render uptime monitoring',
    answer:
      'Render health-checks each instance and can email or Slack you when a service turns unhealthy, but nothing at Render requests your public URL from outside, so uptime monitoring on Render means an external monitor on a /health route.',
    meta: {
      title: 'Render uptime monitoring | Logdash',
      description:
        'What Render health checks catch, what they miss, how free tier sleep and 750 instance hours interact with a monitor, and a Telegram alert in 3 steps.',
    },
    blocks: [
      { type: 'heading', text: 'What Render gives you' },
      {
        type: 'paragraph',
        text: 'Render does more than most platforms here. Set a health check path and Render calls it on every instance every few seconds, expecting a 2xx or 3xx within 5 seconds. After 15 seconds of failures it stops routing traffic to that instance, and after 60 seconds it restarts it. A deploy only goes live once the new instances pass, or it is cancelled after 15 minutes. Notifications go to email, Slack or both, for failed deploys and for a service becoming unhealthy.',
      },
      {
        type: 'paragraph',
        text: 'The gap is the outside view. Those checks go to each instance, not through your domain, so a custom domain that stopped resolving or a regional problem in front of the instances can look healthy from where Render is checking. And the alert travels on the same platform it reports on, so a Render incident can delay the message about it.',
      },
      { type: 'heading', text: 'Render down, or just your app?' },
      {
        type: 'paragraph',
        text: 'Keep two signals. status.render.com lists platform incidents and lets you subscribe by email. Your own monitor says whether your URL answers. If both are red, it is Render and you wait. If only yours is red, it is your code, your database or your config, and you start reading logs.',
      },
      { type: 'heading', text: 'The blueprint and the route' },
      {
        type: 'code',
        language: 'yaml',
        title: 'render.yaml',
        code: `services:
  - type: web
    name: api
    runtime: node
    plan: free
    buildCommand: npm ci
    startCommand: node server.js
    healthCheckPath: /health`,
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'server.js',
        code: `const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

app.get('/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: 'db' });
  }
});

app.listen(process.env.PORT || 10000);`,
      },
      {
        type: 'paragraph',
        text: 'Render calls this route every few seconds per instance, so it has to stay cheap: one select 1, no table reads, no third-party calls.',
      },
      { type: 'heading', text: 'Free tier sleep and uptime monitoring' },
      {
        type: 'paragraph',
        text: 'A free web service spins down after 15 minutes without inbound traffic and takes about a minute to come back. Each workspace gets 750 free instance hours a month, and when they run out Render suspends every free web service until the next month. Render also says free instances are not for production and may restart at any time.',
      },
      {
        type: 'paragraph',
        text: "A monitor checking every 5 minutes is inbound traffic, so the service never idles. That is 720 hours in a 30-day month and 744 in a 31-day one. One monitored free service fits in 750. Two do not, and running out takes down every free service in the workspace, not just the second. Render's docs neither forbid nor endorse keep-alive pings. Our advice: if a service matters enough to monitor, move it to a paid instance type, which does not spin down. If it is a demo, let it sleep and do not monitor it, since the one-minute wake-up is longer than the 10 seconds Logdash waits. And never point a monitor at /robots.txt: a sleeping service answers that itself without waking.",
      },
      { type: 'heading', text: 'Three steps to an alert' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and give it https://yourapp.onrender.com/health, or your custom domain. Five monitors fit in the free plan.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Anything outside 200 to 399 counts as down.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the database under the running service rather than shipping a broken deploy, which Render would refuse to put live. The route returns 503, the next check flips the monitor to down, and a Telegram alert lands with the status code and the error.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs UptimeRobot for Render',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Free monitors',
            logdash: 'Five HTTP monitors',
            them: '50, commercial use allowed',
            winner: 'them',
          },
          {
            feature: 'Free check interval',
            logdash: 'Every 5 minutes',
            them: 'Every 5 minutes',
            winner: 'tie',
          },
          {
            feature: 'Monitor types',
            logdash: 'HTTP checks, push heartbeats on Pro',
            them: 'HTTP, keyword, port, ping, DNS, SSL and more',
            winner: 'them',
          },
          {
            feature: 'Fastest paid interval',
            logdash: '15 seconds on Pro, $15 a month',
            them: '60 seconds on Solo, 30 seconds on Team',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email and Discord free, Slack and Telegram on Solo, webhook on Team',
            winner: 'them',
          },
          {
            feature: 'App logs and metrics',
            logdash: 'Eight SDKs into the same dashboard',
            them: 'Not part of the product',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'You run more than five Render services and want them all on a free plan.',
          'You want email alerts, or SMS and voice. Logdash sends Telegram messages and webhooks only.',
          'You need keyword checks that fail a 200 page showing an error, or port and SSL checks. Logdash has none of those.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is UptimeRobot a good fit for Render?',
        answer:
          'Yes: 50 free monitors at 5 minutes covers every Render service you have, and the free plan now allows commercial use. Faster checks cost more there: 60 seconds on Solo, 30 seconds on Team, against 15 seconds on Logdash Pro at $15 a month.',
      },
      {
        question: 'How do I tell if Render is down or just my app?',
        answer:
          'Check status.render.com and your own monitor side by side. Both red means a platform incident. Only your monitor red means your code, your database or your configuration.',
      },
      {
        question: 'Does Render free tier sleep break uptime monitoring?',
        answer:
          'A 5-minute monitor stops the sleep, because every check is inbound traffic. That keeps one service awake for about 720 to 744 hours a month out of 750 free hours, so a second monitored free service runs the workspace out and suspends all of them.',
      },
      {
        question:
          'Is pinging a Render free tier service to stop sleep allowed?',
        answer:
          "Render's docs neither forbid nor endorse it, and they say free instances are not for production. If a service needs to stay up, a paid instance type is the supported way to stop spin-down.",
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'fly-io',
    h1: 'Fly.io monitoring',
    answer:
      'Fly.io gives you health checks that steer traffic between machines and Grafana dashboards of your metrics, but nothing that tells you when the app goes down, so pair the fly.toml check with an outside HTTP monitor that sends you a Telegram message.',
    meta: {
      title: 'Fly.io monitoring: health checks and alerts | Logdash',
      description:
        'What Fly.io health checks do, why they never restart a machine or tell you anything, and how to add an outside uptime check with Telegram alerts.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: "Fly.io ships two monitoring pieces, and both are good at their job. Service checks in fly.toml stop the Fly Proxy routing to a machine that fails them, and hold back a deploy that never comes up healthy. Metrics land in a managed Prometheus with Grafana dashboards at fly-metrics.net and about 15 days of retention. Neither piece tells you anything. Fly's docs say it plainly: no built-in alerting on metrics, and a failing check does not restart or stop the machine.",
      },
      { type: 'heading', text: 'What Fly.io health checks do' },
      {
        type: 'paragraph',
        text: 'A service check under [[http_service.checks]] runs at the proxy every 30 seconds by default. Fail it and the proxy marks that machine unhealthy and stops sending it traffic until it passes. That is the whole effect. The machine keeps running, nobody gets a message, and fly checks list is the only place the red shows up. The design assumes two or more machines. A side project on one machine has nothing to route to instead, and you hear about it from a user.',
      },
      { type: 'heading', text: 'The check to paste' },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `# Add a service check to fly.toml, then deploy
cat >> fly.toml <<'TOML'

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"
TOML

fly deploy
fly checks list

# The request an outside monitor makes, through DNS and the Fly edge
curl -s -o /dev/null -w '%{http_code} in %{time_total}s\\n' \\
  https://your-app.fly.dev/health`,
      },
      {
        type: 'paragraph',
        text: 'Point the path at a route that runs one cheap database query and returns 503 when it fails, or it passes every check while the database is gone. The curl line takes the path your users take, through public DNS and the Fly edge. The service check never leaves the platform.',
      },
      { type: 'heading', text: 'What Fly.io monitoring leaves out' },
      {
        type: 'list',
        items: [
          'Alerts. A message means writing Grafana alert rules, or running your own Prometheus and Alertmanager. The old Slack and PagerDuty check handlers are gone.',
          'Restarts. A machine failing its check stays up until the app exits with a non-zero code and the restart policy brings it back.',
          'The outside view. A check inside Fly cannot see a custom domain pointing at the wrong place or a problem between your users and the edge.',
          "Fly's own incidents. status.flyio.net reports the platform, not your app.",
        ],
      },
      {
        type: 'heading',
        text: 'Fly.io uptime from outside, with machines that auto-stop',
      },
      {
        type: 'paragraph',
        text: "An outside check is a request like any other. With auto_start_machines on, it starts a stopped machine, and the proxy's stop loop only runs every few minutes, so a 15-second check keeps the app running for good. Logdash gives up after 10 seconds, so a cold boot slower than that reads as down. Either set min_machines_running = 1 and pay for one machine that stays up, or check every 5 minutes and accept that some checks measure boot time.",
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add an HTTP monitor in Logdash and point it at https://your-app.fly.dev/health, or the custom domain your users type. Every check stores the status code and response time.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. 200 to 399 is up. Any other code, or no answer in 10 seconds, is down.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the database or deploy a /health that returns 503. On the next check the monitor flips to down and a Telegram message arrives with the monitor name, status code and error, then another on recovery.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Fly.io built-in checks',
        them: 'Fly.io',
        rows: [
          {
            feature: 'Routes traffic away from a bad machine',
            logdash: 'No, it only watches',
            them: 'Yes, that is what service checks are for',
            winner: 'them',
          },
          {
            feature: 'Holds back a broken deploy',
            logdash: 'No',
            them: 'Yes, deploys wait for checks to pass',
            winner: 'them',
          },
          {
            feature: 'Tells you the app is down',
            logdash: 'Telegram or webhook on every down and up',
            them: 'Nothing built in, Grafana alert rules you write',
            winner: 'logdash',
          },
          {
            feature: 'Check interval',
            logdash: '5 minutes free, 1 minute Builder, 15 seconds Pro',
            them: 'You set it, 30 seconds by default',
            winner: 'them',
          },
          {
            feature: 'CPU, memory and OOM data',
            logdash: 'Only what your app sends through an SDK',
            them: 'Built in, about 15 days in Grafana',
            winner: 'them',
          },
          {
            feature: 'Price',
            logdash: 'Free for 5 monitors',
            them: 'Included with the app',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Fly.io built-in checks',
        reasons: [
          'You run two or more machines and only need traffic to avoid a broken one. Fly does that, Logdash cannot.',
          'You already have Grafana alert rules sending to Slack or email. A second tool adds the outside view and little else.',
          'You need machine CPU, memory and out-of-memory data. That is Fly metrics, not an uptime monitor.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What does Fly.io monitoring include?',
        answer:
          'Service checks that steer routing and deploys, a managed Prometheus with a Grafana instance at fly-metrics.net, and about 15 days of metrics. There is no built-in alerting, so a down app stays silent until you add Grafana alert rules or an outside monitor.',
      },
      {
        question: 'Do Fly.io health checks restart a machine?',
        answer:
          'No. A machine that fails its service check is marked unhealthy and taken out of routing, but it keeps running until someone restarts it. If you want a restart, make the app exit with a non-zero code when it is stuck and the default restart policy brings it back.',
      },
      {
        question: 'Do Fly.io health checks send alerts?',
        answer:
          'No. fly checks list shows the current state and the old Slack and PagerDuty handlers have been removed. For a message you need Grafana alerting on Fly metrics, or an outside monitor such as Logdash, which sends Telegram or webhook alerts.',
      },
      {
        question: 'How do I track Fly.io uptime for my app?',
        answer:
          'Point an outside HTTP monitor at a health route on your public hostname. status.flyio.net only reports the Fly platform, not whether your app answers. Logdash checks every 5 minutes on the free plan and every 15 seconds on Pro, and keeps the uptime history and response times.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'cloudflare',
    h1: 'Cloudflare uptime monitoring',
    answer:
      'Cloudflare has no uptime check on the free plan; Health Checks start on Pro at $20 a month billed yearly and probe your origin directly, so to see what users see through Cloudflare you need an outside HTTP check on a health path Cloudflare never caches or challenges.',
    meta: {
      title: 'Cloudflare uptime monitoring and health checks | Logdash',
      description:
        'What Cloudflare Health Checks and Workers observability cover, which plan you need, the traps that fake an outage, and a Telegram alert in three steps.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Cloudflare sits between your users and your server, which makes it the most important thing to monitor through and the worst thing to monitor with. When the origin dies, Cloudflare keeps answering with its own error pages: 521 when the web server refuses the connection, 522 when it times out, 523 when the origin is unreachable. Users see an outage. Nothing on the free plan tells you about it.',
      },
      { type: 'heading', text: 'Cloudflare health checks' },
      {
        type: 'paragraph',
        text: "Health Checks are Cloudflare's own monitor. None on Free, 10 on Pro, 50 on Business. Pro costs $20 a month billed yearly or $25 month to month, per zone. Each check probes an origin address over HTTP, HTTPS or TCP from the Cloudflare regions you pick, every 60 seconds by default, with retries and a consecutive-failure threshold, and notifies you by email or webhook. A standalone Health Check only watches. Moving traffic away from a dead origin is Load Balancing, a separate paid product.",
      },
      {
        type: 'paragraph',
        text: "The detail that matters: it probes the origin, not your public URL through the edge. A DNS record pointing at the wrong IP, a WAF rule blocking real users, or a cache rule serving yesterday's page all pass an origin check. And it runs on Cloudflare, so a Cloudflare outage silences the monitor along with the site.",
      },
      { type: 'heading', text: 'Cloudflare workers monitoring' },
      {
        type: 'paragraph',
        text: 'Workers get requests, errors, CPU time and duration in the dashboard, plus Workers Logs once you set observability.enabled in the Wrangler config. Issues, in open beta since 30 September 2026, groups uncaught exceptions and 5xx responses and can route them to a webhook or a chat service. Edge and origin error-rate notifications are Enterprise only. All of these need failing traffic to fire. None of them ask whether the Worker answers right now, so give it a health route.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'src/index.ts',
        code: `export interface Env {
  DB: D1Database;
}

const noStore = { 'cache-control': 'no-store' };

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/health') {
      try {
        // One cheap query proves the D1 binding answers.
        await env.DB.prepare('select 1').first();
        return Response.json({ ok: true }, { headers: noStore });
      } catch {
        return Response.json({ ok: false }, { status: 503, headers: noStore });
      }
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;`,
      },
      { type: 'heading', text: 'Two traps that fake an outage' },
      {
        type: 'list',
        items: [
          'Bot Fight Mode can answer a monitor with 403. On the free plan it cannot be skipped by a WAF rule, so turn it off, or on Pro use Super Bot Fight Mode with a skip rule for /health.',
          'Caching. Cloudflare does not cache JSON by default, but a Cache Everything rule will, and then the check reads a stored 200 for hours. Send Cache-Control: no-store.',
        ],
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the public URL',
            text: 'Add a monitor in Logdash and paste https://example.com/health, the hostname users hit, not the origin IP. Logdash sends a GET every 5 minutes on the free plan, every minute on Builder at $9 and every 15 seconds on Pro at $15.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. Any status outside 200-399, or no answer within 10 seconds, counts as down.',
          },
          {
            title: 'Stop the origin',
            text: 'Stop the web server behind Cloudflare. The next check gets a 521 or 522 from the edge and a Telegram alert lands with the monitor name and that code, which tells you the origin is the problem, not Cloudflare.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Cloudflare Health Checks',
        them: 'Cloudflare Health Checks',
        rows: [
          {
            feature: 'Free plan',
            logdash: '5 monitors, 5-minute checks',
            them: 'Not available, Pro and up',
            winner: 'logdash',
          },
          {
            feature: 'What it tests',
            logdash: 'The public URL through the edge',
            them: 'The origin directly',
            winner: 'tie',
          },
          {
            feature: 'Check types',
            logdash: 'HTTP checks',
            them: 'HTTP, HTTPS and TCP',
            winner: 'them',
          },
          {
            feature: 'Check locations',
            logdash: 'One location per check',
            them: 'The Cloudflare regions you pick',
            winner: 'them',
          },
          {
            feature: 'During a Cloudflare outage',
            logdash: 'Runs outside Cloudflare',
            them: 'Runs on Cloudflare',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Cloudflare Health Checks',
        reasons: [
          'You already pay for Pro and want TCP checks on a database or mail port. Logdash only does HTTP.',
          'Several origins share one hostname and you need to know which one is sick. An outside check only sees the combined result.',
          'You use Cloudflare Load Balancing, whose monitors also steer traffic away from a dead origin. No outside monitor can do that.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Cloudflare have an uptime check?',
        answer:
          'Only on paid plans. Health Checks come with Pro (10 checks), Business (50) and Enterprise (1,000), and they probe your origin rather than the public URL. The free plan has no uptime check of any kind.',
      },
      {
        question: 'Are Cloudflare health checks free?',
        answer:
          'No. They need a zone on Pro or above, which is $20 a month billed yearly or $25 month to month. An outside monitor on its free plan covers the public URL instead.',
      },
      {
        question: 'How do I set up Cloudflare website uptime monitoring?',
        answer:
          'Add a health path that bypasses cache, make sure Bot Fight Mode does not challenge it, and point an outside HTTP monitor at the public hostname. A 521, 522 or 523 in the alert means the origin is down, not Cloudflare.',
      },
      {
        question: 'What does Cloudflare Workers monitoring include?',
        answer:
          'Requests, errors, CPU time and duration in the dashboard, Workers Logs when observability is enabled, and Issues in open beta for grouped exceptions. None of it checks that the Worker answers, so add a /health route and monitor it.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'supabase',
    h1: 'Supabase monitoring',
    answer:
      'Supabase gives you usage reports, logs and a Prometheus metrics endpoint but no alert when your project stops answering, so deploy an edge function that runs select 1 against Postgres, returns 503 when it fails, and point an outside monitor at it.',
    meta: {
      title: 'Supabase monitoring: uptime, database, paused projects | Logdash',
      description:
        'A Supabase edge function health check you can paste, what the dashboard and Metrics API cover, why free projects pause, and a Telegram alert in 3 steps.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Supabase is good at telling you how your project behaved. The dashboard has usage reports, logs for Postgres, the API, Auth and edge functions, and the Metrics API exposes about 200 Postgres series in Prometheus format. What it does not do is message you when your project stops answering. status.supabase.com covers platform incidents, not your project, and a project can be down while that page is all green.',
      },
      { type: 'heading', text: 'Supabase project paused' },
      {
        type: 'paragraph',
        text: 'The outage most free projects actually have is a pause. Supabase pauses a free project that has too little database activity over 7 days, and sends a warning email first. A paused project takes Postgres, the API, Auth, Storage and every edge function offline until someone clicks Resume in the dashboard. Supabase says a few user requests to the database each day is typically enough to stay active, so a health check that queries Postgres every 5 minutes, 288 times a day, should also keep the project counted as active. Supabase decides what counts and can change it. The guaranteed fix is a paid plan, from $25 a month, where projects never pause.',
      },
      { type: 'heading', text: 'Supabase database monitoring' },
      {
        type: 'paragraph',
        text: 'For the inside view, every hosted project exposes a Prometheus-compatible endpoint at https://<project-ref>.supabase.co/customer/v1/privileged/metrics, read with HTTP Basic auth: username service_role, password a secret API key. It is in beta, and the Grafana Cloud integration in the dashboard scrapes it in one click. That gives you connections, CPU, memory and disk to alert on. It still cannot tell you the API answers a real request, because the metrics come from the database side.',
      },
      { type: 'heading', text: 'The edge function health check' },
      {
        type: 'code',
        language: 'typescript',
        title: 'supabase/functions/health/index.ts',
        code: `import { Pool } from 'jsr:@db/postgres@^0';

// SUPABASE_DB_URL is set for every deployed function.
const pool = new Pool(Deno.env.get('SUPABASE_DB_URL')!, 1);
const headers = { 'cache-control': 'no-store' };

export default {
  fetch: async () => {
    try {
      const connection = await pool.connect();
      try {
        await connection.queryArray\`select 1\`;
      } finally {
        connection.release();
      }
      return Response.json({ ok: true }, { headers });
    } catch {
      // 503 so a dead database reads as down, not as a crashed check
      return Response.json({ ok: false }, { status: 503, headers });
    }
  },
};`,
      },
      {
        type: 'code',
        language: 'bash',
        code: `supabase functions new health
# paste the code above into supabase/functions/health/index.ts
supabase functions deploy health --no-verify-jwt

curl -i https://<project-ref>.supabase.co/functions/v1/health`,
      },
      {
        type: 'paragraph',
        text: 'Edge functions require a JWT by default, and an uptime monitor does not send one, so deploy this one with --no-verify-jwt. The body is a single boolean, so there is nothing to leak. On the free plan it costs about 8,640 of your 500,000 monthly invocations at a 5-minute interval. A slow cold start is fine, the monitor waits up to 10 seconds before it calls the check failed.',
      },
      { type: 'heading', text: 'Supabase uptime in three steps' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the function URL',
            text: 'Add a monitor in Logdash and paste https://<project-ref>.supabase.co/functions/v1/health. It checks every 5 minutes on the free plan, every minute on Builder at $9 a month and every 15 seconds on Pro at $15.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. Any status outside 200-399, or no answer within 10 seconds, counts as down, so a hung connection pool alerts too.',
          },
          {
            title: 'Break the database',
            text: 'Point the function at a wrong database URL in a test project, or pause the project from the dashboard. The next check fails and a Telegram alert lands with the monitor name, the status code and the error.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Supabase built-in monitoring',
        them: 'Supabase',
        rows: [
          {
            feature: 'Alert when your project stops answering',
            logdash: 'Telegram or webhook on the first failed check',
            them: 'None for your project',
            winner: 'logdash',
          },
          {
            feature: 'Database metrics',
            logdash: 'Status code and response time of the check',
            them: 'Dashboard reports and about 200 Postgres series',
            winner: 'them',
          },
          {
            feature: 'Logs',
            logdash: 'From your own app, via eight SDKs',
            them: 'Postgres, API, Auth and edge function logs built in',
            winner: 'them',
          },
          {
            feature: 'Warning before a free project pauses',
            logdash: 'None, you hear when the check fails',
            them: 'Email before the pause',
            winner: 'them',
          },
          {
            feature: 'Cost',
            logdash: 'Free for 5 monitors',
            them: 'Included',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Supabase built-in tools',
        reasons: [
          'You need to know why the database is slow, not whether it answers. Send the Metrics API to Grafana Cloud, one click from the dashboard, for connections, cache hit rate and disk.',
          'You want stack traces from edge function exceptions. Supabase logs plus an error tracker like Sentry fit that better than an uptime check.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Why was my Supabase project paused?',
        answer:
          'Free projects with too little database activity over 7 days are paused, after a warning email. Click Resume in the dashboard to bring it back. Paid plans are never paused, and a health check that queries Postgres every few minutes should keep a free project active.',
      },
      {
        question: 'How do I monitor Supabase uptime?',
        answer:
          'Deploy a health edge function that runs select 1 and returns 503 on failure, deploy it with --no-verify-jwt, and point an outside HTTP monitor at its URL. It catches a dead database, a paused project and a broken edge runtime with one check.',
      },
      {
        question: 'What is the best tool for Supabase database monitoring?',
        answer:
          'For metrics, the Supabase Metrics API scraped by Grafana Cloud or any Prometheus-compatible tool. For knowing the database answers at all, an outside check on a health function. They answer different questions, and most projects want both.',
      },
      {
        question: 'What should I use for Supabase error monitoring?',
        answer:
          'An error tracker such as Sentry, alongside the edge function logs in the dashboard. An uptime check tells you the project is down, not which line threw. Logdash does the first job, not the second.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'coolify',
    h1: 'Coolify monitoring',
    answer:
      'Coolify watches its own servers and containers - reachability, container stops, disk usage, and CPU and memory through Sentinel - but it never requests your public URLs, so Coolify monitoring needs an outside check on each app and on the Coolify dashboard itself.',
    meta: {
      title: 'Coolify monitoring: what it covers and what it misses | Logdash',
      description:
        'Coolify alerts on stopped containers, unreachable servers and disk usage, but never checks a public URL. Health checks, /api/health and a Telegram alert.',
    },
    blocks: [
      { type: 'heading', text: 'What Coolify monitoring covers' },
      {
        type: 'list',
        items: [
          'Container Status Changes: a container stops unexpectedly, restarts on its own, or hits its restart limit.',
          'Server Reachable, Server Unreachable and Server Disk Usage for every connected server.',
          'Deployment, backup and scheduled task success and failure.',
          'Sentinel, the per-server agent, reports container state and Docker health, and with metrics on it keeps CPU and memory history, sampled every 10 seconds by default.',
          'Alerts go to email, Discord, Telegram, Slack, Mattermost, Pushover or a webhook, with events chosen per channel.',
        ],
      },
      {
        type: 'paragraph',
        text: "That is more than most hosted platforms ship. Coolify's own docs draw the line: use external tools for public endpoint checks from outside your infrastructure.",
      },
      { type: 'heading', text: 'What it cannot see' },
      {
        type: 'paragraph',
        text: 'Every signal above comes from inside the server. A Traefik label pointing at the wrong port, a DNS record that moved, a firewall rule, or an app answering 500 from a healthy container all leave the container running and nothing fires. Worse, if Coolify runs on the same server as your apps and that server dies, the thing that would send Server Unreachable died with it. A Coolify instance can report on the remote servers it manages. Nothing reports on Coolify.',
      },
      { type: 'heading', text: 'Container health checks' },
      {
        type: 'paragraph',
        text: "Under Configuration, Healthcheck, you pick HTTP or CMD, a path, an interval, a timeout and retries. The HTTP check runs inside the container, so the image needs curl or wget, or Docker marks it unhealthy and the rolling update keeps the old container. For the Docker Compose build pack, the health check lives in the compose file. This one uses Node's built-in fetch, so no curl is needed:",
      },
      {
        type: 'code',
        language: 'yaml',
        title: 'docker-compose.yml',
        code: `services:
  app:
    build: .
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s`,
      },
      {
        type: 'paragraph',
        text: 'The Coolify dashboard has a public health endpoint of its own. It needs no token and answers a plain OK. Watch it from outside and you hear about the dashboard going down, the one alert Coolify cannot send about itself:',
      },
      {
        type: 'code',
        language: 'bash',
        code: `curl -fsS https://coolify.example.com/api/health
# OK`,
      },
      { type: 'heading', text: 'Coolify uptime from outside' },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URLs',
            text: 'Add a monitor in Logdash for each app, pointed at its public /health route, and one for https://coolify.example.com/api/health. Five fit in the free plan. Logdash only reaches public addresses, so apps behind a VPN or on a private network are out of reach.',
          },
          {
            title: 'Pick the interval',
            text: 'Every 5 minutes on the free plan, every minute on Builder, every 15 seconds on Pro. Each check stores the status code and the response time.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the app from the Coolify dashboard. Traefik starts answering with an error instead of your app, the next check flips the monitor to down, and a Telegram alert lands with the status code. Coolify sends its own Container Status Changes alert too, and that is fine: one comes from inside, one from outside.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Coolify built-in monitoring',
        them: 'Coolify built-in',
        rows: [
          {
            feature: 'Container stopped or restarting',
            logdash: 'Only if the URL starts failing',
            them: 'Container Status Changes event',
            winner: 'them',
          },
          {
            feature: 'CPU, memory and disk',
            logdash: 'Not measured',
            them: 'Sentinel metrics and a disk usage alert',
            winner: 'them',
          },
          {
            feature: 'Public URL answering',
            logdash: 'A GET every 5 minutes, 1 minute or 15 seconds',
            them: 'Not checked',
            winner: 'logdash',
          },
          {
            feature: 'The Coolify host itself dies',
            logdash: 'Alert from outside',
            them: 'Silent when Coolify ran on that host',
            winner: 'logdash',
          },
          {
            feature: 'Telegram alerts',
            logdash: 'Yes',
            them: 'Yes',
            winner: 'tie',
          },
          {
            feature: 'Private network services',
            logdash: 'Cannot reach them',
            them: 'Sees every container it manages',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Coolify built-in',
        reasons: [
          'Your apps are internal and never get a public URL. Coolify sees them, Logdash cannot.',
          'Container state and disk space are what actually break on your box. Coolify alerts on both and Logdash on neither.',
          'You want HTTP checks on your own hardware. Uptime Kuma is a one-click service in Coolify. Put it on a different server from the apps it watches.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Coolify monitoring include uptime checks?',
        answer:
          'No. Coolify monitoring covers server reachability, container status, disk usage and, with Sentinel metrics on, CPU and memory. It does not request your public URLs, and its docs recommend an external tool for that.',
      },
      {
        question: 'How does Coolify server monitoring work?',
        answer:
          'Sentinel runs on each server and reports container state and Docker health to Coolify, plus CPU and memory history when metrics are enabled. Coolify also checks that each server is reachable and how full its disk is, and sends alerts on the channels you pick.',
      },
      {
        question: 'Who watches the Coolify dashboard if its server goes down?',
        answer:
          'Nobody, unless you add an outside check. Point a monitor at /api/health on your Coolify domain. It is public, needs no token and returns OK, so a failure means the dashboard is unreachable.',
      },
      {
        question: 'How do I track Coolify uptime from outside?',
        answer:
          "Add each app's public health route and the Coolify /api/health endpoint to an external monitor. Logdash checks them every 5 minutes on the free plan and sends a Telegram alert when one stops answering 200 to 399.",
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'hetzner',
    h1: 'Hetzner server monitoring',
    answer:
      'Hetzner Cloud draws CPU, disk and network graphs for every server but sends no alert when one stops answering, so you add an outside HTTP check against a health path on the server or load balancer and route its alert to Telegram.',
    meta: {
      title: 'Hetzner server monitoring with Telegram alerts | Logdash',
      description:
        'What Hetzner Cloud graphs, Robot SysMon and load balancer health checks cover, what they miss, and an outside HTTP check that alerts you on Telegram.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Hetzner servers are cheap, and the monitoring matches the price. The Cloud Console graphs CPU, disk IOPS and network traffic for every server, measured from the hypervisor. That is enough to spot a runaway process. It cannot see inside the guest, so a full disk, an OOM-killed Postgres or nginx answering 502 to every visitor all look normal on those graphs while CPU sits at 12%. And the graphs never message anyone: there is no threshold alert in the Console.',
      },
      { type: 'heading', text: 'Hetzner cloud monitoring: what you get' },
      {
        type: 'list',
        items: [
          'Cloud servers: CPU, disk and network graphs in the Console and through the metrics API. No memory graph, no disk usage, no alerts.',
          'Dedicated servers in Robot: System Monitor (SysMon), free ping, port and HTTP checks. Email only, and it alerts on the second consecutive failure, not the first. Its HTTP check accepts only 200, 301 and 302.',
          'Load balancers: active health checks over HTTP, HTTPS or TCP, every 15 seconds by default with 3 retries. An unhealthy target is pulled from rotation and nobody is told.',
        ],
      },
      { type: 'heading', text: 'Hetzner load balancer health check' },
      {
        type: 'paragraph',
        text: 'If you run a load balancer, its health check is already watching. The catch is the default: the root path, and any 2xx or 3xx counts as healthy. That passes as long as the web server answers, even when the app behind it cannot reach its database. Point it at a real health path, expect exactly 200, and keep the timeout well under the interval.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'hcloud CLI',
        code: `# Check /health on the app port instead of /
hcloud load-balancer update-service my-lb \\
  --listen-port 443 \\
  --health-check-protocol http \\
  --health-check-port 3000 \\
  --health-check-http-path /health \\
  --health-check-http-status-codes 200 \\
  --health-check-interval 15s \\
  --health-check-timeout 5s \\
  --health-check-retries 3

# Which targets does it call healthy right now?
hcloud load-balancer describe my-lb

# What a user gets through the load balancer
curl -sS -o /dev/null -w '%{http_code} in %{time_total}s\\n' \\
  https://example.com/health`,
      },
      {
        type: 'paragraph',
        text: 'That check protects users from one bad target. It does nothing when every target is bad, which on a one or two server setup is the usual outage: the load balancer has nowhere to send traffic, every request fails, and Hetzner sends no notification.',
      },
      { type: 'heading', text: 'Hetzner VPS monitoring from outside' },
      {
        type: 'paragraph',
        text: "An outside HTTP monitor asks the question your users ask, through the same DNS, TLS and load balancer. Logdash sends a GET every 5 minutes on the free plan, every minute on Builder at $9 a month and every 15 seconds on Pro at $15, records the status code and response time, and alerts on the first failed check. Anything outside 200-399, a refused connection or no answer within 10 seconds counts as down. It only calls public addresses, so a private network IP like 10.0.0.2 is rejected: point it at the load balancer or the server's public hostname.",
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and paste https://example.com/health, the same path the load balancer checks. The first check runs straight away, so a wrong path shows up now.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. A webhook works the same way if you route alerts through your own handler.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the app on every target. The next check fails, the monitor flips to down and a Telegram alert lands with the monitor name, the status code and the error. Start the app again and a second message says it is back up.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Hetzner built-in monitoring',
        them: 'Hetzner',
        rows: [
          {
            feature: 'Alert when a Cloud server stops answering',
            logdash: 'Telegram or webhook on the first failed check',
            them: 'None, graphs only',
            winner: 'logdash',
          },
          {
            feature: 'Dedicated server checks',
            logdash: 'HTTP only',
            them: 'SysMon: ping, port, HTTP, DNS and mail protocols',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, from SysMon only',
            winner: 'tie',
          },
          {
            feature: 'Removes a broken server from traffic',
            logdash: 'No, it only watches',
            them: 'Load balancer drops failing targets',
            winner: 'them',
          },
          {
            feature: 'Cost',
            logdash: 'Free for 5 monitors at 5-minute checks',
            them: 'Included with the server',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Hetzner built-in tools',
        reasons: [
          'You run dedicated servers and email is enough. SysMon is free, already in Robot, and checks ping and ports, which Logdash does not.',
          'You only need traffic to avoid one broken server. The load balancer health check does that every 15 seconds with no outside tool.',
          'You need memory and disk usage alerts. Neither Logdash nor the Console sees inside the guest, so run node_exporter with Prometheus for those.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Hetzner server monitoring send alerts?',
        answer:
          'Only for dedicated servers. SysMon in Robot emails you after the second consecutive failed ping, port or HTTP check. Hetzner Cloud servers get graphs and nothing that contacts you, so an outside monitor is the only way to hear about a Cloud server going down.',
      },
      {
        question: 'What is the simplest Hetzner VPS monitoring setup?',
        answer:
          'A health path in your app, one HTTP monitor pointed at it from outside Hetzner, and a Telegram channel. On the Logdash free plan that covers 5 monitors at a 5-minute interval. Add node_exporter later if you want memory and disk graphs.',
      },
      {
        question: 'What does Hetzner Cloud monitoring show?',
        answer:
          'CPU usage, disk IOPS and throughput, and network traffic, measured from the hypervisor and also available through the metrics API. Memory and disk space are not shown, because the host cannot see inside your server.',
      },
      {
        question: 'How do I configure a Hetzner load balancer health check?',
        answer:
          'Set the service health check to HTTP on the port your app listens on, with path /health and status code 200. The defaults are a 15-second interval, a 10-second timeout and 3 retries. The hcloud load-balancer update-service command above sets all of it in one call.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'digitalocean',
    h1: 'DigitalOcean droplet monitoring',
    answer:
      'DigitalOcean already covers droplet monitoring with free resource alerts once you install its metrics agent and Uptime checks at $1 a month each after the first, so an outside monitor earns its place only for Telegram or webhook alerts, sub-minute checks, or a status page.',
    meta: {
      title: 'DigitalOcean droplet monitoring and down alerts | Logdash',
      description:
        'What DigitalOcean Monitoring and Uptime checks give you, what they cost, where they fall short, and a droplet down alert on Telegram in three steps.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'DigitalOcean is the one big host where the built-in tools are good enough for a lot of people, and this page says so up front. There are two products, and they answer different questions. Monitoring asks whether the droplet is healthy from the inside. Uptime asks whether your site answers from the outside. Most droplet outages need both answered.',
      },
      { type: 'heading', text: 'Monitoring: graphs and resource alerts' },
      {
        type: 'paragraph',
        text: 'Monitoring is free. Without the agent you get CPU, bandwidth and disk I/O graphs. With the agent you also get memory, disk usage and load average, plus resource alerts on any of them by email or Slack. That is the part that catches the slow outage: a disk filling at 2% a day, or memory creeping up until the OOM killer takes your app. Install it on any droplet that was created without it.',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'On the droplet',
        code: `# Install the DigitalOcean metrics agent
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash

# It should say "active (running)"
systemctl status do-agent

# The URL your uptime check will hit, from outside
curl -sS -o /dev/null -w '%{http_code} in %{time_total}s\\n' \\
  https://example.com/health`,
      },
      { type: 'heading', text: 'DigitalOcean uptime checks' },
      {
        type: 'paragraph',
        text: 'Uptime checks hit an HTTP or HTTPS URL, or ping an IPv4 address, every 60 seconds from up to four regions: Asia East, Europe, USA East and USA West. Alerts cover downtime, latency and SSL certificate expiry, by email or Slack, after a period you choose of 2 minutes or more. When one region fails, the check retries from the others before it alerts. The first check on an account is free and each one after it is $1 a month. For one droplet and an inbox you read, that is hard to beat.',
      },
      {
        type: 'heading',
        text: 'Where a DigitalOcean droplet down alert falls short',
      },
      {
        type: 'list',
        items: [
          'Channels: email and Slack only. No Telegram, no webhook to your own handler.',
          'Interval: fixed at 60 seconds, and the shortest alert period is 2 minutes.',
          'No public status page for your users. The status page in the docs is a private dashboard per check.',
          'Same provider: the monitor and the droplet both run on DigitalOcean.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Logdash sends a GET every 5 minutes on the free plan, every minute on Builder at $9 a month and every 15 seconds on Pro at $15. It records the status code and response time and alerts on the first failed check: anything outside 200-399, a refused connection, or no answer within 10 seconds. The free plan also includes one hosted status page that shows the same checks to your users.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor in Logdash and paste the health URL you just tested with curl. The first check runs straight away.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add a Telegram channel once and attach it to the monitor. Keep the DigitalOcean resource alerts for disk and memory, they cover what an HTTP check cannot see.',
          },
          {
            title: 'Power the droplet off',
            text: 'Run sudo poweroff, or stop the app. The next check fails and a Telegram alert lands with the monitor name, the status code and the error, such as a refused connection. Power it back on and a second message says it is up.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs DigitalOcean Uptime',
        them: 'DigitalOcean Uptime',
        rows: [
          {
            feature: 'Price for 5 checks every minute',
            logdash: '$9 a month on Builder',
            them: '$4 a month, first check free',
            winner: 'them',
          },
          {
            feature: 'Fastest interval',
            logdash: '15 seconds on Pro',
            them: '60 seconds, fixed',
            winner: 'logdash',
          },
          {
            feature: 'Check types',
            logdash: 'HTTP checks',
            them: 'HTTP, HTTPS, ICMP ping and SSL expiry',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email and Slack',
            winner: 'tie',
          },
          {
            feature: 'Public status page',
            logdash: 'One hosted page on the free plan',
            them: 'Not offered',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'DigitalOcean Uptime',
        reasons: [
          'You have one or two droplets and Slack or email is where you look. At $1 a check a month, with the first one free, that costs less than any paid Logdash plan.',
          'You need SSL expiry or ping alerts. Logdash has neither.',
          'You want checks from four regions so one bad network path does not page you.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is DigitalOcean droplet monitoring free?',
        answer:
          'Yes. Monitoring costs nothing, and installing the metrics agent adds memory, disk usage and load graphs plus resource alerts by email or Slack. Uptime checks are separate: one free per account, then $1 a month each.',
      },
      {
        question: 'How do DigitalOcean uptime checks work?',
        answer:
          'They request your URL, or ping an IPv4 address, every 60 seconds from up to four regions. You attach up to 5 alerts per check, for downtime, latency or SSL expiry, each with a period of 2 minutes or longer before it fires.',
      },
      {
        question: 'How do I get a DigitalOcean droplet down alert on Telegram?',
        answer:
          'DigitalOcean cannot send one, its alerts go to email and Slack. Point an outside HTTP monitor such as Logdash at a health URL on the droplet and attach a Telegram channel. On the free plan the alert arrives within 5 minutes, on Builder within 1.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'vps',
    h1: 'VPS monitoring',
    answer:
      'VPS monitoring means an outside check that alerts you when the server stops answering, plus a heartbeat from inside that stops when the disk fills or the app dies, because most provider dashboards give you graphs rather than alerts.',
    meta: {
      title: 'VPS monitoring: free uptime checks and alerts | Logdash',
      description:
        'An outside HTTP check on the free plan, a heartbeat script that goes quiet when the disk fills or the app dies, and Telegram alerts in 3 steps.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Start with what the provider already gives you. Hetzner Cloud shows CPU, network and disk IO graphs in its console and sends no alerts. DigitalOcean has a free metrics agent with threshold alerts, and uptime checks at $1 a month each after the first. Most others sit between the two. A resource graph cannot tell you that nginx answers 502 to every visitor, because the box itself looks idle.',
      },
      {
        type: 'paragraph',
        text: 'Two failures matter on a single VPS. The fast one: the server or the app stops answering from outside, after a kernel panic, the OOM killer, a bad deploy or a provider network fault. The slow one: logs fill the disk until Postgres refuses writes. The first needs a check from somewhere else. The second needs something on the box.',
      },
      { type: 'heading', text: 'VPS uptime monitoring from outside' },
      {
        type: 'paragraph',
        text: 'Put an HTTP monitor on a public URL of your app, ideally a health route that runs one database query. The Logdash free plan covers five monitors checked every 5 minutes, Builder checks every minute for $9 a month, Pro every 15 seconds for $15. Every check records the status code and response time. Anything outside 200 to 399, or no answer within 10 seconds, counts as down.',
      },
      { type: 'heading', text: 'A heartbeat from inside the box' },
      {
        type: 'code',
        language: 'bash',
        title: '/usr/local/bin/vps-heartbeat',
        code: `#!/bin/sh
# Pings Logdash only while the disk has room and the app answers locally.
# Cron starts it once a minute; it pings six times, 10 seconds apart,
# because a Pro push monitor expects a ping in every 15-second window.
PING_URL="https://api.logdash.io/ping/YOUR_MONITOR_ID"
APP_URL="http://127.0.0.1:3000/health"

for i in 1 2 3 4 5 6; do
  used=$(df --output=pcent / | tail -n 1 | tr -dc '0-9')
  if [ "$used" -lt 90 ] && curl -fsS -m 2 -o /dev/null "$APP_URL"; then
    curl -fsS -m 2 -o /dev/null -X POST "$PING_URL"
  fi
  sleep 10
done

# chmod +x /usr/local/bin/vps-heartbeat, then crontab -e:
# * * * * * /usr/local/bin/vps-heartbeat`,
      },
      {
        type: 'paragraph',
        text: 'Push monitors are a Pro feature. The script folds two checks into one signal: when the root disk passes 90% or the app stops answering on localhost, the pings stop and the monitor goes down. Add a memory or load check the same way. The df flags are GNU, so this runs as is on Debian and Ubuntu. One missed 15-second window is an alert, so a short network blip shows up as a down and up pair. That is the cost of hearing about real problems within 30 seconds.',
      },
      { type: 'heading', text: 'VPS monitoring tool for the box itself' },
      {
        type: 'paragraph',
        text: 'Graphs of CPU, memory and disk over time are an agent job: Netdata, Beszel, or the provider agent on DigitalOcean. Logdash does not install one. Keep the agent for diagnosis and the outside check for the alert, because an agent on a box that has stopped cannot report its own death unless something outside expects to hear from it.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Watch it from outside',
            text: 'Add an HTTP monitor in Logdash and point it at https://yourapp.com/health. This part runs on the free plan.',
          },
          {
            title: 'Add the heartbeat',
            text: 'On Pro, create a push monitor, put its id in the script, make it executable and add the crontab line. The monitor turns green within a minute.',
          },
          {
            title: 'Trip the threshold',
            text: 'Change 90 to 1 in the script so the disk check fails. The pings stop, the push monitor goes down within 30 seconds, and a Telegram alert lands saying no call was received for this time range.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Where the checker runs',
            logdash: 'Hosted, outside your server',
            them: 'A server you run, ideally not the one it watches',
            winner: 'tie',
          },
          {
            feature: 'Free tier',
            logdash: 'Five HTTP monitors every 5 minutes',
            them: 'As many monitors as the box can handle',
            winner: 'them',
          },
          {
            feature: 'Heartbeats from the box',
            logdash: 'Pro only, $15 a month',
            them: 'Push monitors included',
            winner: 'them',
          },
          {
            feature: 'Disk, memory and CPU',
            logdash: 'No agent, you script the threshold into the heartbeat',
            them: 'Not collected either',
            winner: 'tie',
          },
          {
            feature: 'Monitor types',
            logdash: 'HTTP and push',
            them: 'HTTP, TCP, ping, DNS, keyword and more',
            winner: 'them',
          },
          {
            feature: 'Maintenance',
            logdash: 'Nothing to update',
            them: 'Container updates, backups and its own uptime',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You already pay for a second server at a different provider. Kuma on that box watches the first one for free.',
          'You need TCP or ping checks on things that do not speak HTTP, such as SSH or a game server.',
          'You want dozens of monitors and are happy to own the box they run on.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the best VPS monitoring tool?',
        answer:
          'Two tools, not one. An outside uptime monitor for "is it answering", and an agent such as Netdata or Beszel, or your provider agent, if you want CPU, memory and disk graphs. Logdash covers the first and folds disk or memory thresholds into a heartbeat, but it runs no agent.',
      },
      {
        question: 'Is there free VPS monitoring?',
        answer:
          'Yes. The Logdash free plan checks five URLs every 5 minutes with Telegram alerts. Uptime Kuma is free if you have a second server to run it on. Heartbeats from inside the box need Logdash Pro.',
      },
      {
        question: 'How does VPS uptime monitoring work?',
        answer:
          'A server somewhere else requests a URL on your VPS on a schedule and records the status code and response time. Anything outside 200 to 399, or a timeout, flips the monitor to down and sends the alert.',
      },
      {
        question: 'Can I run VPS monitoring on the VPS itself?',
        answer:
          'For resource graphs, yes. For uptime, no: a monitor on the same box goes down with it and never sends the alert. Run the uptime check from outside, or at least from another provider.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'homelab',
    h1: 'Homelab monitoring',
    answer:
      'Homelab monitoring needs two layers, detailed checks inside the lab, usually Uptime Kuma, and one watcher outside it, because a monitor that shares your power, router and internet line goes silent exactly when those fail.',
    meta: {
      title: 'Homelab monitoring: what Uptime Kuma cannot see | Logdash',
      description:
        'Uptime Kuma inside the lab, heartbeats out of it for services behind NAT, and a Telegram alert when the power, router or ISP takes everything down.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Most homelabs end up with Uptime Kuma in a container, and it is a good choice. It checks every VM, container and device on the LAN by HTTP, ping, TCP or DNS, sends to around 90 notification providers and costs nothing. The gap is where it lives. When the power goes, the router reboots into a bad config or the ISP drops you for an hour, Kuma goes down with everything else, or it sees the failure and has no route out to tell you. You find out when you get home, or when someone in the house asks why Jellyfin is broken.',
      },
      {
        type: 'paragraph',
        text: 'The fix is not replacing Kuma. It is one thing outside the lab that expects to hear from it. Services behind NAT cannot be checked from the internet without opening ports, so the lab pushes instead: a small script checks each service locally and sends a heartbeat out only when the service answered. No port forwarding, no tunnel, no public IP.',
      },
      { type: 'heading', text: 'Heartbeats out of the lab' },
      {
        type: 'code',
        language: 'bash',
        title: '/usr/local/bin/lab-heartbeat',
        code: `#!/bin/sh
# Usage: lab-heartbeat <local url> <logdash monitor id>
# Pings Logdash only while the local service answers. Six pings a minute,
# because a Pro push monitor expects one in every 15-second window.
for i in 1 2 3 4 5 6; do
  curl -fsS -m 2 -o /dev/null "$1" &&
    curl -fsS -m 2 -o /dev/null -X POST "https://api.logdash.io/ping/$2"
  sleep 10
done

# chmod +x it, then crontab -e on an always-on box, one line per service:
# * * * * * /usr/local/bin/lab-heartbeat http://192.168.1.20:8096/ JELLYFIN_MONITOR_ID
# * * * * * /usr/local/bin/lab-heartbeat http://192.168.1.30:8123/ HASS_MONITOR_ID`,
      },
      {
        type: 'paragraph',
        text: 'Push monitors are a Pro feature, $15 a month for up to 50 monitors, and on Pro Logdash expects a heartbeat in every 15-second window. Cron runs at most once a minute, so the script loops six times with 2-second timeouts, which keeps every gap under 15 seconds. One missed window is an alert, so run it on a box with a wired connection. A flaky Wi-Fi link turns into pairs of down and up messages.',
      },
      {
        type: 'heading',
        text: 'A homelab monitoring stack that covers both failures',
      },
      {
        type: 'list',
        items: [
          'Inside: Uptime Kuma for every container, disk and device. Fine-grained, free, and on the LAN where it can reach everything.',
          'Outside: one heartbeat per service that matters, sent by the script above. When all of them go quiet at once, the problem is power, the router or the line, not a service.',
          'Public services: anything you expose through a reverse proxy or a tunnel can take a plain HTTP monitor instead. Five of those run on the free plan, checked every 5 minutes. Logdash refuses private addresses, so a 192.168 URL has to use a heartbeat.',
          'A status page: the free plan includes one public page, so the household can check it before they message you.',
        ],
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create the push monitors',
            text: 'One monitor per thing you care about, each set to "You send heartbeats". Copy each id into its crontab line.',
          },
          {
            title: 'Install the script',
            text: 'Save it, make it executable, add the crontab lines. Within a minute every monitor is green and Telegram gets an up message for each, so you know the path works.',
          },
          {
            title: 'Unplug the WAN cable',
            text: 'Every heartbeat stops at once. Within 30 seconds Logdash marks each monitor down, and the Telegram alerts land on your phone over mobile data, one per service, while the whole lab is still offline.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma in the lab',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Sees LAN-only services',
            logdash: 'Through heartbeats your script sends',
            them: 'Directly, by HTTP, ping, TCP or DNS',
            winner: 'them',
          },
          {
            feature: 'Alerts on a power cut or ISP outage',
            logdash: 'Yes, the silence is the alert',
            them: 'No, it is down or offline too',
            winner: 'logdash',
          },
          {
            feature: 'Adding a service',
            logdash: 'One crontab line per service',
            them: 'A few clicks in the UI',
            winner: 'them',
          },
          {
            feature: 'Notification channels',
            logdash: 'Telegram and webhook',
            them: 'Around 90 providers',
            winner: 'them',
          },
          {
            feature: 'Maintenance',
            logdash: 'Nothing to update',
            them: 'One container to update and back up',
            winner: 'tie',
          },
          {
            feature: 'Cost',
            logdash: 'Heartbeats need Pro, $15 a month',
            them: 'Free on hardware you already run',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma alone',
        reasons: [
          'You only care about single services failing, and you would notice a power cut or a dead line anyway because you are at home.',
          'You want the outside watcher free. Kuma plus a free Healthchecks.io account, 20 jobs with a Telegram integration, covers both layers for nothing.',
          'You want ping, TCP and DNS checks on every device. Logdash does HTTP and heartbeats, nothing else.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is the best setup for homelab monitoring?',
        answer:
          'Two layers. Uptime Kuma or similar inside the lab for every service, and one watcher outside it that alerts when the lab goes quiet. Without the second layer, a power cut or an ISP outage produces no alert at all.',
      },
      {
        question:
          'How do I do homelab uptime monitoring without opening ports?',
        answer:
          'Push instead of pull. A script on the LAN checks each service locally and POSTs a heartbeat out to a hosted monitor. Outbound HTTPS needs no port forwarding, no tunnel and no static IP.',
      },
      {
        question: 'Should I run Uptime Kuma in my homelab?',
        answer:
          'Yes, it is the best free tool for checking things on a LAN. Just do not make it the only monitor, because it shares power, router and internet with everything it watches.',
      },
      {
        question: 'What goes in a homelab monitoring stack?',
        answer:
          'An inside checker such as Uptime Kuma, an outside heartbeat watcher, a status page for the people who use your services, and alerts on a channel you read on your phone. Grafana and Prometheus come later, if you want graphs of the hardware.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'raspberry-pi',
    h1: 'Raspberry Pi uptime monitor',
    answer:
      'Have the Pi send a heartbeat out to a hosted monitor every 10 seconds from cron, so a crash, a power cut or a dead home connection all end the same way: the heartbeats stop and an alert reaches your phone.',
    meta: {
      title: 'Raspberry Pi uptime monitor that works behind NAT | Logdash',
      description:
        'One crontab line that pushes a heartbeat from your Pi every 10 seconds, so a crash, a power cut or a dead home connection ends in a Telegram alert.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A Pi at home sits behind your router with no public address. A classic uptime monitor calls in from the internet, so it cannot reach the Pi without port forwarding, dynamic DNS or a tunnel, and each of those is one more thing that breaks at 2am. A monitor running on the Pi itself has the opposite problem: when the Pi loses power, it loses its monitor too.',
      },
      {
        type: 'paragraph',
        text: 'So flip the direction. The Pi calls out, and outbound HTTPS works from behind any home router with no ports opened. A Logdash push monitor expects a ping in every check window and alerts when one goes missing. That silence covers every way a Pi fails: a corrupted SD card, a kernel panic, a tripped fuse, someone borrowing the power supply.',
      },
      { type: 'heading', text: 'The crontab line' },
      {
        type: 'code',
        language: 'bash',
        title: 'crontab -e',
        code: `# Cron fires once a minute. The loop pings six times, 10 seconds apart,
# because a Pro push monitor expects a ping in every 15-second window.
* * * * * for i in 1 2 3 4 5 6; do curl -fsS -m 4 -o /dev/null -X POST https://api.logdash.io/ping/YOUR_MONITOR_ID; sleep 10; done`,
      },
      {
        type: 'paragraph',
        text: 'Push monitors are a Pro feature, $15 a month, and on Pro Logdash looks for a heartbeat every 15 seconds. One empty window marks the monitor down. Plain cron cannot run more often than once a minute, which is why the line starts a short loop instead of a single curl. The -m 4 caps each request at 4 seconds, so the gap between two pings never stretches past 14. The ping is a bare POST with no body and no auth header, so there is nothing to install beyond curl, which Raspberry Pi OS ships with.',
      },
      { type: 'heading', text: 'Raspberry Pi internet uptime monitor' },
      {
        type: 'paragraph',
        text: 'The ping leaves through your home connection, so a dead line looks exactly like a dead Pi: the heartbeats stop, the monitor flips to down, and the alert reaches your phone over mobile data. When the line comes back, the next ping flips it up and a second message says so, which gives you the outage length for the call with your ISP. It cannot tell the two causes apart on its own. Run uptime -s on the Pi afterwards: a boot time older than the outage means the Pi stayed up and the line did not.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a monitor in Logdash, choose "You send heartbeats" and copy the ping URL. The id at the end is the only thing the line above needs.',
          },
          {
            title: 'Install the line',
            text: 'Run crontab -e on the Pi as your normal user, paste the line with your id, save. Within a minute the monitor turns green, and the first heartbeat sends an up message to Telegram, which proves the alert path before you need it.',
          },
          {
            title: 'Pull the plug',
            text: 'Unplug the Pi or its network cable. Within 30 seconds of the last ping the monitor goes down, and a Telegram alert lands naming the monitor, status code 0 and the reason: no call received for this time range.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma on the Pi',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Works behind NAT',
            logdash: 'Yes, the Pi calls out',
            them: 'Yes, it runs inside your network',
            winner: 'tie',
          },
          {
            feature: 'Alerts when the Pi loses power',
            logdash: 'Yes, the missing heartbeat is the alert',
            them: 'No, the monitor is off too',
            winner: 'logdash',
          },
          {
            feature: 'Alerts when the home internet drops',
            logdash: 'Within 30 seconds, to your phone',
            them: 'Sees it, cannot send until the line is back',
            winner: 'logdash',
          },
          {
            feature: 'Checks other devices on the LAN',
            logdash: 'No, HTTP checks only reach public addresses',
            them: 'HTTP, ping, TCP and DNS to anything on the network',
            winner: 'them',
          },
          {
            feature: 'Notification channels',
            logdash: 'Telegram and webhook',
            them: 'Around 90 providers',
            winner: 'them',
          },
          {
            feature: 'Price',
            logdash: 'Push monitors need Pro, $15 a month',
            them: 'Free, on the Pi you already own',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You want to watch the other boxes on your network: the NAS, the printer, Home Assistant. Kuma on the Pi does that and Logdash cannot reach a private address.',
          'You do not want to pay for a hobby Pi. Kuma is free, and for the outside heartbeat Healthchecks.io monitors 20 jobs on its free plan, with Telegram among its integrations.',
          'You already run Kuma. Keep it for the LAN and add one heartbeat out, so something outside notices when Kuma itself goes dark.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'How do I set up a Raspberry Pi uptime monitor?',
        answer:
          'Create a push monitor, paste one crontab line that POSTs to its ping URL every 10 seconds, and connect Telegram. The Pi calls out, so it works behind NAT with no port forwarding and no static IP.',
      },
      {
        question: 'Can I use a Raspberry Pi as an internet uptime monitor?',
        answer:
          'Yes. The same heartbeat leaves through your home connection, so when the line drops the pings stop and the alert reaches your phone over mobile data. The up message when the line returns gives you the outage length.',
      },
      {
        question: 'What should Raspberry Pi monitoring cover besides uptime?',
        answer:
          'Temperature and throttling, which vcgencmd get_throttled reports, and free space on the SD card. Logdash runs no agent on the Pi, but the Python SDK can chart any number you read yourself, such as the value in /sys/class/thermal/thermal_zone0/temp.',
      },
      {
        question: 'Does a Raspberry Pi uptime monitor need port forwarding?',
        answer:
          'Not with a push monitor. Only outbound HTTPS to api.logdash.io is needed, which every home router allows by default. An HTTP monitor would need a public URL, and Logdash refuses private addresses such as 192.168.x.x.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'wordpress',
    h1: 'WordPress uptime monitoring',
    answer:
      'Point an outside HTTP monitor at a URL that has to run PHP and reach MySQL, not only the cached homepage, and send the alert somewhere you read within minutes; no plugin is required.',
    meta: {
      title: 'WordPress uptime monitoring without a plugin | Logdash',
      description:
        'Monitor a WordPress site from outside with nothing to install. An optional health route, an honest Jetpack Monitor comparison and Telegram alerts.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'WordPress goes down in a few predictable ways. The database stops accepting connections, a plugin update throws a fatal error, or the host runs out of PHP workers under a traffic spike. The first two answer with HTTP 500, as "Error establishing a database connection" and "There has been a critical error on this website", so any monitor that reads the status code catches them.',
      },
      {
        type: 'paragraph',
        text: 'The trap is caching. A page cache plugin or a CDN can keep serving the homepage as stored HTML, with a 200, while PHP behind it is dead. A monitor watching that homepage reports a perfect week while every login, comment and checkout fails. Jetpack Monitor sends a HEAD request to the homepage every 5 minutes, so it shares that blind spot.',
      },
      {
        type: 'heading',
        text: 'WordPress uptime monitoring plugin, or no plugin',
      },
      {
        type: 'paragraph',
        text: 'A monitor that runs inside WordPress cannot report WordPress being down, so every real option, Jetpack included, checks from outside servers. Logdash needs nothing installed on the site. The file below is optional: it gives the monitor a route that always runs PHP and queries the database.',
      },
      {
        type: 'code',
        language: 'php',
        title: 'wp-content/mu-plugins/health.php',
        code: `<?php
// GET /wp-json/health/v1/check: 200 when PHP runs and MySQL answers.
add_action('rest_api_init', function () {
    register_rest_route('health/v1', '/check', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {
            global $wpdb;
            $ok = $wpdb->get_var('SELECT 1') === '1';
            $response = new WP_REST_Response(['ok' => $ok], $ok ? 200 : 503);
            $response->header('Cache-Control', 'no-store');
            return $response;
        },
    ]);
});`,
      },
      {
        type: 'paragraph',
        text: 'Create the mu-plugins folder if it does not exist. Must-use plugins load on every request with no activation step, and nobody can switch them off from the dashboard by accident. On plain permalinks the URL is /?rest_route=/health/v1/check. If your cache plugin caches REST responses, exclude this path. The route skips the theme, so a fatal error inside a template only shows on real pages. On an uncached site the homepage is the better URL; on a cached one, watch both as two monitors.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the monitor',
            text: 'Add a monitor in Logdash and paste the health URL, or the homepage if you skipped the file. The free plan covers five sites checked every 5 minutes, Builder checks every minute for $9 a month, Pro every 15 seconds for $15.',
          },
          {
            title: 'Connect Telegram',
            text: 'Add the channel once and every site can use it. A webhook works too if alerts should go through your own handler.',
          },
          {
            title: 'Break staging on purpose',
            text: 'Put a wrong DB_PASSWORD in wp-config.php on a staging copy. WordPress answers 500, the monitor flips to down on the next check, and a Telegram alert arrives with the status code and the first lines of the error page.',
          },
        ],
      },
      { type: 'heading', text: 'WordPress downtime monitoring beyond the 500' },
      {
        type: 'paragraph',
        text: 'Not every outage is a clean error page. When the host runs out of PHP workers, requests queue until the web server gives up with a 502 or 504, or they simply hang. Logdash counts any status outside 200 to 399 as down, and a request with no answer after 10 seconds as well, so both shapes trip the monitor. A site that is merely slow stays up, and the response time chart shows the climb, so check it after every plugin update.',
      },
      { type: 'heading', text: 'Jetpack downtime monitor, honestly' },
      {
        type: 'paragraph',
        text: 'If Jetpack is already on the site, its monitor is the cheapest answer there is: free, one toggle, alerts by email and the mobile apps. The limits are in the details. It only checks the homepage, the email only goes to the account that connected Jetpack, and it stops working when that connection breaks. Logdash fits when you want the check to hit a route of your choosing and the alert in Telegram.',
      },
      {
        type: 'comparison',
        title: 'Logdash vs Jetpack Monitor',
        them: 'Jetpack Monitor',
        rows: [
          {
            feature: 'Free plan',
            logdash: 'Five sites',
            them: 'Free on every site running Jetpack',
            winner: 'them',
          },
          {
            feature: 'Free check interval',
            logdash: 'Every 5 minutes',
            them: 'Every 5 minutes',
            winner: 'tie',
          },
          {
            feature: 'Faster checks',
            logdash: 'Every minute on Builder, 15 seconds on Pro',
            them: 'Every minute with the paid upgrade in Jetpack Manage',
            winner: 'tie',
          },
          {
            feature: 'What gets checked',
            logdash: 'Any URL you choose, so the check can skip the page cache',
            them: 'A HEAD request to the homepage',
            winner: 'logdash',
          },
          {
            feature: 'Needs on the site',
            logdash: 'Nothing',
            them: 'The Jetpack plugin and a working WordPress.com connection',
            winner: 'logdash',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email and app push, SMS and extra recipients on the upgrade',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Jetpack Monitor',
        reasons: [
          'Jetpack is already installed and connected. Turning on the monitor is one toggle and costs nothing.',
          'You want alerts by email. Logdash does not send email.',
          'You run client sites from Jetpack Manage and want downtime in the same dashboard as their backups and updates.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Do I need a WordPress uptime monitoring plugin?',
        answer:
          'No. The check has to run from outside the site, because a plugin inside WordPress dies with it. Even Jetpack Monitor only uses the plugin to switch on checks that run on Jetpack servers.',
      },
      {
        question: 'Is the Jetpack downtime monitor free?',
        answer:
          'Yes. It checks the homepage every 5 minutes and alerts by email and the Jetpack or WordPress app, but only the account that connected Jetpack gets the email. One-minute checks, SMS and extra recipients are a paid upgrade inside Jetpack Manage.',
      },
      {
        question: 'How do I get a WordPress site down alert on my phone?',
        answer:
          'Point a Logdash monitor at the site and connect a Telegram channel. The alert lands when the status flips to down, and a second one when the site recovers, so you also get the length of the outage.',
      },
      {
        question: 'What does WordPress downtime monitoring actually catch?',
        answer:
          'Anything that changes the status code: a database outage or a fatal error returns 500, a dead host returns nothing, and a check that takes over 10 seconds counts as down. A cached homepage hides PHP failures, which is what the health route is for.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'shopify',
    h1: 'Shopify store uptime monitoring',
    answer:
      'Shopify keeps its own servers up, so the useful thing to monitor is what Shopify does not watch for you: your storefront on your custom domain and any app or webhook endpoint you host yourself, each with an HTTP check that sends a Telegram alert when it stops answering.',
    meta: {
      title: 'Shopify store uptime monitoring | Logdash',
      description:
        'What Shopify already monitors, what it does not, and how to watch your storefront, custom domain and app webhook endpoints with Telegram alerts.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Shopify runs the servers, the checkout and the CDN, and it does that well. Its status page at shopifystatus.com reports platform components such as Storefront, Checkout and Admin, and you can subscribe to it. What it does not report is your store. Shopify can be fully operational while your custom domain points somewhere else after a registrar change, or the app that syncs your orders has been returning 500 since Tuesday. Those are the failures worth an uptime check, because nobody at Shopify is watching them for you.',
      },
      {
        type: 'heading',
        text: 'What Shopify status covers, and what it does not',
      },
      {
        type: 'paragraph',
        text: 'On Cyber Monday 2025, merchants were locked out of Admin and POS for several hours while storefronts and checkouts kept selling. Shopify called it a system degradation. That is the right level of detail for a platform page and the wrong one for you: it tells you Shopify is having a bad day, never that your store is the one with the problem.',
      },
      { type: 'heading', text: 'What is worth a check' },
      {
        type: 'list',
        items: [
          'Your storefront on the primary domain. It fails when the domain stops pointing at Shopify, which is usually someone editing records at the registrar.',
          'One product page. It runs more of the theme than the homepage, and it is the page your ads send people to.',
          'Your app backend, if you built one. The Shopify app template is a React Router app with Prisma, and it runs on your server, not on Shopify.',
          'Your webhook receiver. Shopify waits 5 seconds, retries 8 times over 4 hours, then deletes subscriptions created through the Admin API. One dead afternoon can cost you the subscription, not just the events.',
        ],
      },
      { type: 'heading', text: 'See what a monitor will see' },
      {
        type: 'code',
        language: 'bash',
        title: 'terminal',
        code: `# Status code, final URL after redirects, total time
for url in \\
  https://yourstore.com/ \\
  https://yourstore.com/products/best-seller \\
  https://your-app.example.com/healthz; do
  curl -sL -o /dev/null \\
    -w "%{http_code} %{url_effective} %{time_total}s\\n" "$url"
done`,
      },
      {
        type: 'paragraph',
        text: 'If you built an app from the template, give it a health route that touches the session database. With flat routes, this file answers at /healthz and sits outside the authenticated app routes.',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'app/routes/healthz.ts',
        code: `import prisma from "../db.server";

export async function loader() {
  const headers = { "Cache-Control": "no-store" };
  try {
    // One cheap query: the session database answers
    await prisma.$queryRaw\`SELECT 1\`;
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers });
  }
}`,
      },
      { type: 'heading', text: 'What Logdash cannot see on Shopify' },
      {
        type: 'paragraph',
        text: 'A password-protected store redirects every page to /password, and that page answers 200. Logdash follows up to 5 redirects and has no keyword checks, so a store someone locked by accident stays green. The curl loop above shows it as a final URL ending in /password. The same goes for a sold-out product or a broken theme section: the page loads and the status code is fine. If that is the failure you fear, a keyword monitor is the right tool and Logdash does not have one.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the storefront',
            text: 'Add an HTTP monitor in Logdash and point it at your primary domain. Each check records the status code and the response time, so slow theme days show up next to outages.',
          },
          {
            title: 'Add the app',
            text: 'Add a second monitor for https://your-app.example.com/healthz. That is 2 of the 5 monitors on the free plan, each checked every 5 minutes. Builder checks every minute, Pro every 15 seconds.',
          },
          {
            title: 'Break it on purpose',
            text: 'Stop the app database or deploy a healthz that returns 503. On the next check the monitor flips to down and a Telegram message lands with the monitor name, the status code and the error, then another when it recovers.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs the Shopify status page',
        them: 'shopifystatus.com',
        rows: [
          {
            feature: 'Watches your own domain',
            logdash: 'Yes, an HTTP check on your URL',
            them: 'No, platform components only',
            winner: 'logdash',
          },
          {
            feature: 'Watches your app and webhook endpoints',
            logdash: 'Yes, any public URL you host',
            them: 'No',
            winner: 'logdash',
          },
          {
            feature: 'Explains platform incidents',
            logdash: 'No, you see the failure, not the cause',
            them: 'Yes, written by Shopify while it happens',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, webhook and RSS subscriptions',
            winner: 'them',
          },
          {
            feature: 'Catches a password page left on',
            logdash: 'No, it answers 200',
            them: 'No',
            winner: 'tie',
          },
          {
            feature: 'Price',
            logdash: 'Free for 5 monitors',
            them: 'Free',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'shopifystatus.com',
        reasons: [
          'Your store runs on a domain bought through Shopify and you host no app. Almost everything that can break is Shopify, and their page will say so.',
          'You want to know why checkout is failing, not only that it is. Only Shopify can tell you that.',
          'You want alerts by email. The status page sends them, Logdash sends Telegram messages and webhooks only.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question:
          'Do I need Shopify uptime monitoring if Shopify hosts my store?',
        answer:
          'Not for Shopify servers, they have their own on-call. You need it for what is yours: the custom domain, the product pages your ads point at, and any app or webhook endpoint you host. Those break without Shopify ever posting an incident.',
      },
      {
        question: 'How do I get a Shopify store down alert?',
        answer:
          'Point an HTTP monitor at your storefront URL and connect Telegram. Logdash checks every 5 minutes on the free plan and messages you on the check where the store goes down, with the status code, then again when it is back.',
      },
      {
        question: 'Where do I check Shopify status?',
        answer:
          'shopifystatus.com is the official page. It lists Shopify components, current incidents and past ones, and you can subscribe for updates. Lookalike status pages exist, so check the domain before you trust one.',
      },
      {
        question: 'Does Shopify status show if my store is down?',
        answer:
          'No. It reports Shopify as a platform. A store whose domain points at the wrong place, or whose app backend returns 500, shows as fully operational there, which is why the check has to run against your own URL.',
      },
    ],
    updatedAt: '2026-10-02',
  },
];

export const platforms: SeoFamilyData = {
  family: platformsFamily,
  pages: platformsPages,
};
