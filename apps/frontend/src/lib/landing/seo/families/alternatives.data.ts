import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family A. The intent here is "replace the tool I already use", which is a
 * different search than `/vs/*`'s "help me choose between two tools", so both
 * sets of pages stay.
 *
 * Every comparison table carries at least one row the competitor wins and one
 * tie, and every page carries a `pick-them` block. An all-green table is a
 * lie, and a reader who catches one stops believing the rest of the page.
 */
export const alternativesFamily: SeoFamily = {
  key: 'alternatives',
  hubPath: '/alternatives',
  hubLabel: 'All alternatives',
  title: 'Uptime monitoring alternatives | Logdash',
  description:
    'Honest side-by-side pages for every uptime and cron monitoring tool people move to Logdash from, including when the other tool is the better pick.',
  intro:
    'One page per tool, each with the setup, the comparison and the case for staying where you are.',
};

export const alternativesPages: SeoPage[] = [
  {
    slug: 'uptimerobot',
    h1: 'UptimeRobot alternative for founders stuck on the 5-minute free tier',
    answer:
      'Logdash checks HTTP endpoints every 5 minutes on the free plan and every 15 seconds on Pro, and puts the logs and metrics from the same service on the same page, so upgrading buys you more than a shorter gap between pings.',
    meta: {
      title: 'UptimeRobot alternative for founders | Logdash',
      description:
        'HTTP checks every 5 minutes free, 15 seconds on Pro, Telegram and webhook alerts, a status page, and your app logs and metrics on the same service.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'UptimeRobot is the monitor almost everyone sets up first, and for one marketing site it is still a reasonable answer. The strain shows up on the second service. You add the API, then the worker, then the staging box, and the 5-minute interval starts to matter, because a deploy that breaks at 09:00:10 is a deploy you hear about at 09:05. Five minutes of a checkout endpoint returning 500 is a support thread, not a blip.',
      },
      {
        type: 'paragraph',
        text: 'The fix on offer is a paid plan, and the paid plan buys exactly one thing: a shorter gap. The logs still live somewhere else. The error rate still lives somewhere else. When the alert lands at 3am you still open three tabs to work out whether the box is down, the database is down, or a migration ate the connection pool. That is the upsell wall - you pay more and the actual work of diagnosing an outage does not get one step shorter.',
      },
      {
        type: 'paragraph',
        text: 'Logdash also checks every 5 minutes on the free plan. That part is a tie and pretending otherwise would be a lie. What changes is what sits next to the check: the uptime history, the response time chart, the log lines from the same second the check failed, and any metric registered from your own code. One service, one page. Pro drops the interval to 15 seconds, and the free plan covers five services rather than one.',
      },
      { type: 'heading', text: 'A health endpoint worth checking' },
      {
        type: 'code',
        language: 'javascript',
        title: 'server.js',
        code: `app.get('/health', async (req, res) => {
  try {
    await db.query('select 1');
    res.status(200).json({ ok: true });
  } catch (err) {
    // 503 so the monitor sees the database, not just the process
    res.status(503).json({ ok: false, error: 'db' });
  }
});`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the service',
            text: 'Point a monitor at https://yourapp.com/health. Logdash stores the status code and the response time on every check, so the latency chart builds itself.',
          },
          {
            title: 'Connect a channel',
            text: 'Add a Telegram channel once at the cluster level and every monitor can use it. Webhooks work the same way if you want to route alerts through your own handler.',
          },
          {
            title: 'Break it before it breaks you',
            text: 'Stop the process and wait one interval. The monitor flips to down and the Telegram alert arrives naming the endpoint and the status code, which is how you learn your alerting works before an outage teaches you it does not.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs UptimeRobot',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Free check interval',
            logdash: 'Every 5 minutes',
            them: 'Every 5 minutes',
            winner: 'tie',
          },
          {
            feature: 'Monitor types',
            logdash: 'HTTP checks and push heartbeats',
            them: 'HTTP, keyword, port, ping, SSL and heartbeat',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook, and that is the list',
            them: 'Email, SMS, voice, Slack, Discord, webhook',
            winner: 'them',
          },
          {
            feature: 'Fastest interval on a paid plan',
            logdash: '15 seconds',
            them: 'Sub-minute on the higher tiers',
            winner: 'tie',
          },
          {
            feature: 'App logs and custom metrics',
            logdash: 'Eight SDKs into the same service view',
            them: 'Not part of the product',
            winner: 'logdash',
          },
          {
            feature: 'Source code',
            logdash: 'MIT licensed, public repository',
            them: 'Closed source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'You need SSL expiry, port, ping or keyword checks. Logdash has none of them and none of them are close.',
          'You want an SMS or a phone call when things break. Logdash sends Telegram messages and webhooks, and nothing else.',
          'You already have forty monitors and a team that knows the dashboard. Rebuilding that is a day you probably do not have to spare.',
        ],
      },
      { type: 'heading', text: 'What moving actually costs' },
      {
        type: 'paragraph',
        text: 'About an hour for five services, and there is no importer. Create a service per app, paste the URL, add the Telegram channel once. The slow part is not the monitors, it is dropping an SDK into each app so the logs land beside them, and that is an install and a token per service. Keep both running for a week. If they disagree about an outage, the one you should trust is whichever one is not hosted next to the thing it watches.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a free UptimeRobot alternative?',
        answer:
          'Yes. The Logdash free plan covers five services with a 5-minute check on each, one public status page, and Telegram or webhook alerts. Same interval UptimeRobot gives away, with logs and metrics attached to the same service.',
      },
      {
        question: 'Is there a self hosted UptimeRobot alternative?',
        answer:
          'Uptime Kuma is the usual answer and it is a good one. Logdash is MIT licensed and runs locally for development, but a one-command production install is not ready yet and is tracked on GitHub, so use the hosted version if you want it working today.',
      },
      {
        question: 'Is there an open source alternative to UptimeRobot?',
        answer:
          'Logdash is MIT licensed and the repository is public. Uptime Kuma and Gatus are the other two names that come up most often, and both self-host today.',
      },
      {
        question: 'What does Reddit recommend instead of UptimeRobot?',
        answer:
          'The thread usually lands on Uptime Kuma if you are happy running a container, healthchecks.io for cron jobs, and a hosted tool if you have already been bitten by a monitor going down with its host.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'uptime-kuma',
    h1: 'Uptime Kuma alternative for people who do not want to run a server',
    answer:
      'Logdash is the hosted version of what Kuma does for most people - HTTP checks, heartbeats, a status page and alerts - with no VPS, no container and no SQLite file to back up.',
    meta: {
      title: 'Uptime Kuma alternative, hosted | Logdash',
      description:
        'Hosted HTTP checks, push heartbeats, a status page and Telegram alerts, with no container to update. Honest about where Uptime Kuma is the better pick.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Uptime Kuma is genuinely good software. The dashboard looks better than most paid products, it covers more monitor types than anything else in its price bracket, the notification provider list is enormous, and it costs nothing but a container. If you already have a box with spare capacity and you enjoy owning your data, running Kuma is the right call and this page is not going to argue you out of it.',
      },
      {
        type: 'paragraph',
        text: 'The reason people leave is not the software. It is that a monitor running on your own infrastructure shares a fate with your infrastructure. The night the host has a problem is the night Kuma has the same problem, quietly, and you find out from a customer instead of from a notification. Underneath that sits the maintenance nobody plans for: container updates, the database volume, a reverse proxy certificate, and a notification config you set up once in 2024 and have never tested since.',
      },
      {
        type: 'paragraph',
        text: 'Logdash is the hosted answer to that, not a drop-in self-hosted replacement, and the distinction matters. Logdash is MIT licensed with a public repository, but production self-hosting is not a one-command install today. It runs locally for development and the rest is tracked on GitHub. If self-hosting is the actual point for you, stay on Kuma. If the point was a monitor that keeps working when your server does not, that is the trade on offer here.',
      },
      { type: 'heading', text: 'The endpoint the hosted check hits' },
      {
        type: 'code',
        language: 'python',
        title: 'main.py',
        code: `@app.get("/health")
async def health():
    try:
        await db.execute("select 1")
    except Exception:
        # 503 so a live process with a dead database still reads as down
        raise HTTPException(status_code=503, detail="db")
    return {"ok": True}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create the service',
            text: 'Add the app and paste the health URL. The first check runs straight away, so you find out the URL is wrong now rather than during an incident.',
          },
          {
            title: 'Move the heartbeats',
            text: 'Anything that used a Kuma push URL posts to https://api.logdash.io/ping/<httpMonitorId> instead. No auth header, no body, no query string.',
          },
          {
            title: 'Turn the app off',
            text: 'Stop the container and let one check fail. The status page flips to down and the Telegram alert arrives with the status code, this time sent from somewhere that is not the machine you just turned off.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Where it runs',
            logdash: 'Hosted, nothing to update',
            them: 'Your server, your updates, your backups',
            winner: 'tie',
          },
          {
            feature: 'Monitor types',
            logdash: 'HTTP checks and push heartbeats',
            them: 'HTTP, TCP, ping, DNS, keyword, certificate expiry and more',
            winner: 'them',
          },
          {
            feature: 'Survives your infrastructure failing',
            logdash: 'Runs outside your stack',
            them: 'Goes down with the host it sits on',
            winner: 'logdash',
          },
          {
            feature: 'Notification channels',
            logdash: 'Telegram and webhook',
            them: 'Dozens of providers built in',
            winner: 'them',
          },
          {
            feature: 'App logs and custom metrics',
            logdash: 'Eight SDKs into the same service view',
            them: 'Not what Kuma is for',
            winner: 'logdash',
          },
          {
            feature: 'Cost at five services',
            logdash: 'Covered by the free plan',
            them: 'Free, plus whatever the box costs',
            winner: 'tie',
          },
          {
            feature: 'Production self-hosting',
            logdash: 'Not ready, tracked on GitHub',
            them: 'The entire point, one container',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You already run a homelab or a VPS with headroom. Kuma costs one container and you keep every byte of the history.',
          'You need TCP, DNS, ping or certificate expiry checks. Logdash has none of those and is not near having them.',
          'Monitoring has to stay inside your network, on hosts with no public egress.',
          'Self-hosting in production is the requirement. Kuma does that today and Logdash does not, which is the honest end of the comparison.',
        ],
      },
      { type: 'heading', text: 'What migrating involves' },
      {
        type: 'paragraph',
        text: 'No importer, and for most people that is fine because the list is a dozen URLs. Copy them across, swap the Kuma push URLs in your jobs for the Logdash ping URL, and leave Kuma running for a week alongside. Two monitors watching the same endpoint costs nothing and settles the argument. The history does not come with you, so if you quote an uptime figure to customers, screenshot the Kuma dashboard before you shut it down.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a self hosted alternative to Uptime Kuma?',
        answer:
          'Not from Logdash, not for production. The code is MIT and runs locally for development, but a one-command production install is not ready and is tracked on GitHub. Gatus and Healthchecks are the closer self-hosted comparisons.',
      },
      {
        question: 'Can I just run Uptime Kuma in Docker instead?',
        answer:
          'Yes, and for a lot of people that is the right answer. One container, one volume for the database, done in ten minutes. The trade is that the monitor now lives on infrastructure you also have to keep alive.',
      },
      {
        question: 'Is there a free alternative to Uptime Kuma?',
        answer:
          'Logdash has a free plan with five services checked every 5 minutes, a public status page and Telegram alerts. Kuma is free too, so the real comparison is a hosted free tier against your time plus a server bill.',
      },
      {
        question: 'Is Logdash open source like Uptime Kuma?',
        answer:
          'Yes, MIT licensed, repository on GitHub. The difference is intent: Kuma is built to be run by you, Logdash is built to be run for you, and only one of those two ships a production install today.',
      },
      {
        question: 'What do people on Reddit use instead of Uptime Kuma?',
        answer:
          'Gatus when they want checks defined in YAML next to the app, Healthchecks for cron, and a hosted monitor once they have had an outage where Kuma was on the same host as the thing that broke.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'pingdom',
    h1: 'Pingdom alternative for a solo founder with four services',
    answer:
      'Logdash monitors four services on the free plan with 5-minute HTTP checks, a public status page and Telegram alerts, instead of an annual contract shaped for a company with a procurement process.',
    meta: {
      title: 'Pingdom alternative for solo founders | Logdash',
      description:
        'Uptime checks, response times, a status page and Telegram alerts for four services on a free plan, without buying synthetic monitoring by the check.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Pingdom is built for a company with a monitoring budget line, and the product shows it. Synthetic monitoring and real user monitoring are priced as separate things, transaction checks are sold by the check, the invoice is annual, and changing the shape of the plan involves a conversation. None of that is a flaw if you are the kind of organisation where adding a monitor means filing a ticket.',
      },
      {
        type: 'paragraph',
        text: 'It reads differently when you are one person with an API, a background worker, a landing page and a staging box. The whole requirement is: tell me if any of the four stopped answering, put it on my phone, and give me a page I can point customers at while I fix it. Pingdom does all of that. It also bills you for a synthetic monitoring platform you will open four times a year, and it has no permanent free tier to fall back to.',
      },
      {
        type: 'paragraph',
        text: 'Logdash is sized for the four-service case. The free plan covers five services with a check every 5 minutes each, one public status page, and alerts on Telegram or a webhook. Pro takes the interval to 15 seconds and puts the status page on your own domain. What you do not get is real user monitoring or scripted browser transactions, and if either of those is why the Pingdom invoice exists, stop reading here.',
      },
      { type: 'heading', text: 'The endpoint Logdash will call' },
      {
        type: 'code',
        language: 'go',
        title: 'health.go',
        code: `func health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		http.Error(w, "db unavailable", http.StatusServiceUnavailable)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "ok")
}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the four services',
            text: 'Four URLs, four monitors. Every check records the status code and the response time, so the latency history exists without you configuring a thing.',
          },
          {
            title: 'Publish the status page',
            text: 'Make a service public and you have a status page carrying its uptime history. A custom domain is a Pro setting, so the URL customers bookmarked can stay the same after a DNS change.',
          },
          {
            title: 'Point a monitor at a broken URL',
            text: 'Aim one check at something that returns 500 and wait a single interval. The Telegram message arrives naming the endpoint and the code, which is the only way to know your alerting works before 3am asks the question for you.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Pingdom',
        them: 'Pingdom',
        rows: [
          {
            feature: 'Cost for four services',
            logdash: 'Free plan covers five',
            them: 'Paid from the first check, trial only',
            winner: 'logdash',
          },
          {
            feature: 'Uptime checks with response time',
            logdash: 'Status code and latency on every check',
            them: 'Status code and latency on every check',
            winner: 'tie',
          },
          {
            feature: 'Real user monitoring',
            logdash: 'Not built',
            them: 'A separate, mature product',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook',
            them: 'Email, SMS, Slack, PagerDuty and more',
            winner: 'them',
          },
          {
            feature: 'App logs and custom metrics',
            logdash: 'Eight SDKs into the same service view',
            them: 'A separate SolarWinds product',
            winner: 'logdash',
          },
          {
            feature: 'Status page',
            logdash: 'Included, custom domain on Pro',
            them: 'Included on paid plans',
            winner: 'tie',
          },
          {
            feature: 'Source code',
            logdash: 'MIT licensed, public repository',
            them: 'Closed source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Pingdom',
        reasons: [
          'You need real user monitoring. Watching actual page loads by browser and country is a different product and Logdash does not have one.',
          'You need multi-step transaction checks, the log-in-then-checkout kind. Logdash sends one request and reads one response.',
          'You need checks from named regions because a latency target is written into a contract.',
          'Someone in the business already signed a SolarWinds agreement and monitoring is inside it, in which case the marginal cost of Pingdom is zero.',
        ],
      },
      { type: 'heading', text: 'What the move looks like' },
      {
        type: 'paragraph',
        text: 'Half an hour, most of it spent finding URLs. There is nothing to export and nothing to import. Add the services, set the Telegram channel once, and keep Pingdom until the renewal date so you run both for a month. The one real loss is the historical uptime record, so if you publish an annual figure, take the numbers out of Pingdom before the account lapses.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a free Pingdom alternative?',
        answer:
          'Yes. Logdash has a free plan with five services, a 5-minute check on each, a public status page and Telegram alerts. Pingdom sells a trial rather than a permanent free tier.',
      },
      {
        question: 'Is there an open source Pingdom alternative?',
        answer:
          'Logdash is MIT licensed with the code on GitHub. Uptime Kuma and Gatus are the self-hosted options people usually pair with that question, and both run in production today.',
      },
      {
        question: 'Can Logdash replace Pingdom completely?',
        answer:
          'For HTTP uptime, response time, a status page and alerts, yes. For real user monitoring or scripted transaction checks, no, and there is no plan to fake it.',
      },
      {
        question: 'How often does Logdash check an endpoint?',
        answer:
          'Every 5 minutes on the free plan and every 15 seconds on Pro. Every check stores the status code and the response time.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'better-stack',
    h1: 'Better Stack alternative for teams who only wanted uptime checks',
    answer:
      'Logdash gives you the HTTP monitors, status page and alerts without the on-call schedules, escalation policies and incident timelines you are being billed for and never configured.',
    meta: {
      title: 'Better Stack alternative for small teams | Logdash',
      description:
        'HTTP monitors, push heartbeats, a status page and Telegram alerts on a free plan, minus the on-call rotations and escalation policies you never turned on.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Better Stack is a competent incident management platform that happens to include uptime checks. If you run a rotation, escalate to a second responder, and write postmortems afterwards, it earns the money. The part small teams actually use is much narrower: is the API answering, tell me on my phone, and show customers a status page while I work out what happened.',
      },
      {
        type: 'paragraph',
        text: 'The bill tracks the suite rather than the usage. Monitors are priced per monitor, log ingestion is priced by volume and retention, seats are priced per person, and the plan you land on is sized by incident tooling instead of by the four checks you run. The paging features are the expensive ones and they are the exact features a three-person team never sets up, because the rotation is one phone and the escalation policy is your co-founder.',
      },
      {
        type: 'paragraph',
        text: 'Logdash does the narrow version on purpose. HTTP checks with status code and response time, cron-scheduled intervals, push heartbeats for background jobs, a public status page with a custom domain on Pro, and alerts on Telegram or a webhook. No schedules, no escalation ladders, no acknowledgement tracking. If someone has to be woken in a defined order at 4am and it matters that the second name gets called when the first one sleeps through, that is a real requirement and Better Stack has it.',
      },
      { type: 'heading', text: 'The health check the monitor reads' },
      {
        type: 'code',
        language: 'typescript',
        title: 'app/api/health/route.ts',
        code: `export async function GET() {
  try {
    await sql\`select 1\`;
    return Response.json({ ok: true });
  } catch {
    // 503, not 200 with a body the monitor cannot read
    return Response.json({ ok: false }, { status: 503 });
  }
}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Recreate the monitors',
            text: 'One service per app, one URL each. Every check keeps the status code and the response time, and the uptime history is drawn from those rather than a separate counter.',
          },
          {
            title: 'Move the status page',
            text: 'Make the service public and repoint the DNS record your customers already use. Custom domains are a Pro setting, so the address on your support docs does not need editing.',
          },
          {
            title: 'Retire the escalation policy',
            text: 'Connect Telegram, take the staging app down on purpose, and watch the alert arrive with the failing endpoint in it. That is the whole on-call configuration, and it behaves the same at 4am as it does at 4pm.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Better Stack',
        them: 'Better Stack',
        rows: [
          {
            feature: 'On-call schedules and escalation',
            logdash: 'Not built',
            them: 'Rotations, escalation policies, acknowledgements',
            winner: 'them',
          },
          {
            feature: 'Phone and SMS alerts',
            logdash: 'Telegram and webhook only',
            them: 'Phone, SMS, Slack, email and more',
            winner: 'them',
          },
          {
            feature: 'Uptime checks with response time',
            logdash: 'Both stored on every check',
            them: 'Both stored on every check',
            winner: 'tie',
          },
          {
            feature: 'Heartbeats for background jobs',
            logdash: 'A public POST, no auth header',
            them: 'Heartbeat monitors included',
            winner: 'tie',
          },
          {
            feature: 'Cost at four services and one person',
            logdash: 'Free plan covers five services',
            them: 'Priced as an incident platform',
            winner: 'logdash',
          },
          {
            feature: 'Logs',
            logdash: 'Eight SDKs, retention by plan',
            them: 'A full log platform billed by volume',
            winner: 'tie',
          },
          {
            feature: 'Source code',
            logdash: 'MIT licensed, public repository',
            them: 'Closed source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Better Stack',
        reasons: [
          'You have a genuine on-call rotation. Schedules, escalation and acknowledgement tracking are the product, and Logdash has none of it.',
          'You need a phone call, not a Telegram notification that a do-not-disturb setting can swallow.',
          'Your logs already run through them at volume, and moving ingestion is a far bigger job than moving four monitors.',
          'Someone external asks for incident timelines and postmortems held in one system.',
        ],
      },
      { type: 'heading', text: 'What migrating costs' },
      {
        type: 'paragraph',
        text: 'The monitors take twenty minutes and the status page takes a DNS change and a wait. The part that is not free is the habit. If your team currently relies on an escalation policy to guarantee somebody answers, a Telegram channel is a downgrade, and it is better to know that now than to discover it during the first incident after the switch. Run both for two weeks and cancel only once you have missed nothing.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is a cheaper alternative to Better Stack?',
        answer:
          'Logdash covers uptime, status pages and alerts on a free plan that includes five services. It is cheaper because it does less: no on-call schedules, no escalation policies, no acknowledgement tracking.',
      },
      {
        question: 'Is there an open source Better Stack alternative?',
        answer:
          'Logdash is MIT licensed with a public repository, though production self-hosting is not ready and is tracked on GitHub. For self-hosting the uptime half today, Uptime Kuma is the usual pick.',
      },
      {
        question: 'Can Logdash replace Better Uptime?',
        answer:
          'For HTTP monitors, heartbeats, a status page and alerts, yes. For paging a rotation in a defined order until someone acknowledges, no.',
      },
      {
        question: 'Does Logdash have a status page?',
        answer:
          'Yes, a public page per service showing its uptime history, with a custom domain available on Pro.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'cronitor',
    h1: 'Cronitor alternative for cron jobs and uptime in one tool',
    answer:
      'Logdash watches background jobs with push heartbeats and HTTP endpoints with scheduled checks on the same service, alerting to the same Telegram channel when either one goes quiet.',
    meta: {
      title: 'Cronitor alternative for jobs and uptime | Logdash',
      description:
        'Push heartbeats for background jobs and HTTP checks for your API in one dashboard, with Telegram alerts. Honest about where Cronitor still wins on cron.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Cronitor is the best cron monitor there is at the cron part, and that is worth saying before anything else. It parses the schedule you give it, so it can tell you a job never started rather than only that a job failed. The CLI wraps the command, captures the exit code and the output, and a discover command reads a crontab and creates the monitors for you. Fifty jobs across ten boxes is exactly the problem it was built for.',
      },
      {
        type: 'paragraph',
        text: 'The reason to look elsewhere is usually consolidation. Cron jobs are one of the three things you actually watch. The other two are whether the API is answering and what the logs said at the second it stopped. Running a cron monitor, an uptime monitor and a log tool means three bills, three alert configurations, and three tabs to correlate at the precise moment you have no patience for tabs.',
      },
      {
        type: 'paragraph',
        text: 'Logdash puts them on one service: a push monitor for the job, an HTTP monitor for the API, and logs and metrics from the same app through an SDK. The heartbeat is a plain POST with no auth header and no body, so it fits on the end of a crontab line without installing a client. One thing to know up front - Logdash expects a heartbeat inside each check window, so push monitors suit jobs that run frequently rather than a weekly backup.',
      },
      { type: 'heading', text: 'Ping from the crontab line' },
      {
        type: 'code',
        language: 'bash',
        title: 'crontab -e',
        code: `# Drain the outbox every minute. The && means a failed run stays silent,
# and silence is what trips the monitor.
* * * * * /srv/app/bin/drain-outbox && curl -fsS -m 10 -X POST \\
  https://api.logdash.io/ping/6710b3f2c9a14e0021d9f8ab

# Same idea from inside a script, after the work is done.
#!/usr/bin/env bash
set -euo pipefail
/srv/app/bin/drain-outbox
curl -fsS -m 10 -X POST https://api.logdash.io/ping/6710b3f2c9a14e0021d9f8ab`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service, switch the monitor to push, and copy the ping URL. The id in that URL is the monitor id and it is the only thing the endpoint needs.',
          },
          {
            title: 'Append the curl',
            text: 'Put it after the command with && so a failed run never reports success. Anything that can make an HTTP request works: cron, a systemd timer, a GitHub Action, a Kubernetes CronJob.',
          },
          {
            title: 'Comment the job out',
            text: 'Disable it for one cycle and let the heartbeat go missing. The monitor records the miss and the Telegram alert arrives telling you the job stopped running, which is the failure mode that never shows up in your error tracker.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Cronitor',
        them: 'Cronitor',
        rows: [
          {
            feature: 'Schedule awareness',
            logdash: 'Alerts on a missing heartbeat',
            them: 'Parses the schedule and knows when a run is late',
            winner: 'them',
          },
          {
            feature: 'Ping shape',
            logdash: 'One public POST, no auth, no body',
            them: 'Ping URLs with run, complete and fail states',
            winner: 'tie',
          },
          {
            feature: 'Exit code and output capture',
            logdash: 'Not built',
            them: 'The CLI wraps the command and keeps both',
            winner: 'them',
          },
          {
            feature: 'HTTP uptime checks in the same tool',
            logdash: 'Same service, same dashboard',
            them: 'Also included',
            winner: 'tie',
          },
          {
            feature: 'Application logs and custom metrics',
            logdash: 'Eight SDKs into the same service view',
            them: 'Job output, not application logging',
            winner: 'logdash',
          },
          {
            feature: 'Free plan',
            logdash: 'Five services, checks every 5 minutes',
            them: 'Free tier for a small number of monitors',
            winner: 'tie',
          },
          {
            feature: 'Source code',
            logdash: 'MIT licensed, public repository',
            them: 'Closed platform, open source clients',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Cronitor',
        reasons: [
          'Your jobs run nightly or weekly. Cronitor knows the schedule and applies a grace period; Logdash wants a heartbeat inside every check window.',
          'You have a lot of jobs. Reading a crontab and creating the monitors automatically beats pasting curl lines by hand across ten hosts.',
          'You need to know a run started, ran too long, or exited non-zero, not only that it finished. Logdash sees one ping and nothing around it.',
          'You want the job output attached to the alert so you can read the traceback without opening an SSH session first.',
        ],
      },
      { type: 'heading', text: 'Moving a crontab across' },
      {
        type: 'paragraph',
        text: 'One line per job. Swap the Cronitor ping URL for the Logdash one and keep the && so a failing command stays quiet instead of reporting a clean run. Two curls on a single line costs nothing, so run both for a week and check they agree about which runs happened. What does not transfer is the schedule parsing, so plan the frequent jobs onto push monitors and leave the nightly ones where they are until you have watched the new alerts fire.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there an open source Cronitor alternative?',
        answer:
          'Logdash is MIT licensed with the code on GitHub. Healthchecks is the other name people give, and it self-hosts in production today, which Logdash does not yet.',
      },
      {
        question: 'Is there a free Cronitor alternative?',
        answer:
          'Logdash has a free plan covering five services with HTTP checks every 5 minutes. Push heartbeat monitors are a Pro feature, so the free plan gets you uptime checks rather than job monitoring.',
      },
      {
        question: 'Can Logdash monitor cron jobs and websites together?',
        answer:
          'Yes. A push monitor for the job and an HTTP monitor for the site, on the same service, alerting through the same Telegram channel.',
      },
      {
        question: 'What is the Logdash heartbeat URL?',
        answer:
          'POST https://api.logdash.io/ping/<httpMonitorId>. It is public, so there is no auth header, no body and no query string to get wrong.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'healthchecks-io',
    h1: 'Healthchecks.io alternative for heartbeats and uptime checks in one place',
    answer:
      'Logdash puts cron heartbeats and HTTP uptime checks in the same hosted dashboard, which is the better trade unless you want to self-host, because Healthchecks.io self-hosts properly today and Logdash does not.',
    meta: {
      title: 'Healthchecks.io alternative | Logdash',
      description:
        'Cron heartbeats and HTTP uptime checks in one hosted dashboard, with Telegram and webhook alerts. Includes where Healthchecks.io is still the better tool.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Healthchecks.io watches jobs that are supposed to call it, and it does that well. Almost nobody leaves because it broke. They leave because it is one of three tabs. Heartbeats live in Healthchecks.io, uptime checks live somewhere else, logs live in a third place, and a failed nightly job plus the 500s it caused become two separate investigations at 3am.',
      },
      {
        type: 'paragraph',
        text: 'Logdash runs both directions in one project. Pull monitors hit a URL on a schedule and record the status code and the response time. Push monitors sit and wait for your job to call in. Same alert channels, same uptime history, and the logs your SDK sends land beside them. When the queue drains late and the API starts handing out 503s, the two sit next to each other on one timeline instead of being reconstructed from timestamps in two tabs.',
      },
      {
        type: 'paragraph',
        text: 'The honest part first. Healthchecks.io is open source and the self-hosted build is the same code that runs the hosted service, so you can have it on your own box tonight. Logdash is MIT licensed with the source on GitHub, but self-hosting is not a one-command install today. It runs locally for development, and production self-hosting is open work tracked on GitHub. If self-hosting is why you are reading this, stay where you are.',
      },
      { type: 'heading', text: 'Ping Logdash from the job you already run' },
      {
        type: 'code',
        language: 'bash',
        title: 'crontab',
        code: `# A push monitor takes a plain POST. No auth header, no body.
curl -fsS -m 10 -X POST https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234

# Chained behind && so a failed run stays silent and the monitor goes red.
* * * * * /srv/app/bin/drain-queue && curl -fsS -m 10 -X POST https://api.logdash.io/ping/68b4c1f0e3a2d5c7b9f01234`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create a push monitor',
            text: 'Add a service, set the monitor to push mode and copy the monitor id out of the ping URL.',
          },
          {
            title: 'Ping at the end of the job',
            text: 'Append the curl to the command in your crontab. Put it behind && so a non-zero exit never reports success.',
          },
          {
            title: 'Attach Telegram',
            text: 'Connect a Telegram channel to the monitor. The first check window that passes without a ping sends the alert to Telegram.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Healthchecks.io',
        them: 'Healthchecks.io',
        rows: [
          {
            feature: 'HTTP uptime checks',
            logdash: 'Pull monitors record status code and response time',
            them: 'Heartbeats only, nothing reaches out to your URL',
            winner: 'logdash',
          },
          {
            feature: 'Heartbeat signals',
            logdash: 'One POST when the job finishes',
            them: 'Ping, plus start, fail and exit code signals',
            winner: 'them',
          },
          {
            feature: 'Expected schedule per job',
            logdash:
              'The monitor expects a ping inside every check window on your plan',
            them: 'A cron expression and a grace period per check',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook, and that is the whole list',
            them: 'A long list of integrations out of the box',
            winner: 'them',
          },
          {
            feature: 'Logs and metrics beside the monitor',
            logdash: 'Eight SDKs, same project, same timeline',
            them: 'Not part of the product',
            winner: 'logdash',
          },
          {
            feature: 'Public status page',
            logdash: 'Public dashboard, custom domain on Pro',
            them: 'Status badges you can embed',
            winner: 'logdash',
          },
          {
            feature: 'Open source',
            logdash: 'MIT, full source on GitHub',
            them: 'Open source, full source on GitHub',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Healthchecks.io',
        reasons: [
          'You want to self-host in production. Their self-hosted build is the same code as the hosted service. Ours is not there yet, and saying otherwise would waste your evening.',
          'Your jobs run on their own odd schedules. A cron expression and a grace period per check is the right model for a backup that runs at 03:00 on Sundays, and Logdash does not have that.',
          'You need the alert somewhere Logdash cannot send it. A webhook bridge you build and then maintain is still a thing you maintain.',
          'Nothing you own answers HTTP. If you only ever watch jobs, half of Logdash is dead weight.',
        ],
      },
      { type: 'heading', text: 'What moving over actually takes' },
      {
        type: 'paragraph',
        text: 'Per job it is one line: swap the ping URL and keep the same shell. The schedule model is the part that takes thought. A Logdash push monitor wants to hear from you inside every check window rather than by a deadline you set, so anything that runs less often than the window needs rethinking. Most people move the frequent jobs first, leave the nightly ones on Healthchecks.io, and decide later. Keep both pinging for a week while you do it. A duplicate heartbeat costs nothing, and running them side by side is how you find out that one of your jobs has been quietly failing since a deploy in March.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there an open source Healthchecks.io alternative?',
        answer:
          'Healthchecks.io is itself open source, so you may already have what you are looking for. Logdash is MIT licensed with the full source on GitHub, and adds HTTP uptime checks, logs and metrics next to the heartbeats.',
      },
      {
        question: 'Can I self-host Logdash instead?',
        answer:
          'Not in production yet. The repo runs locally for development, and a supported production install is open work tracked on GitHub. If self-hosting is a hard requirement today, self-hosted Healthchecks.io is the better call.',
      },
      {
        question: 'Does Logdash do cron job monitoring?',
        answer:
          'Yes, through push monitors. Your job sends a POST to https://api.logdash.io/ping/<monitorId> when it finishes, and the monitor goes down if a check window passes without one. There is no per-job cron expression or grace period, which is the main difference.',
      },
      {
        question: 'Which alert channels does Logdash support?',
        answer:
          'Telegram and webhooks. That is the complete list. Everything else has to go through the webhook, which means you build and keep the bridge.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'checkly',
    h1: 'Checkly alternative for teams that do not need browser synthetics',
    answer:
      'Logdash checks whether your API answers and how fast, with no browser and no test code to maintain, which is all that most Checkly accounts were actually doing.',
    meta: {
      title: 'Checkly alternative without synthetics | Logdash',
      description:
        'HTTP checks with status code and response time, Telegram and webhook alerts, no Playwright suite to keep green. Plus where Checkly is worth the extra work.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Checkly is a synthetics product. You write Playwright, it runs in hosted runners on a schedule, and you find out the checkout flow broke before a customer does. That is real value, and nothing on this page replaces it. A signup form can break in a way that still returns 200 on every request, and only a browser catches that.',
      },
      {
        type: 'paragraph',
        text: 'The trouble is that plenty of Checkly accounts are not doing that. They are hitting /health, hitting /api/v1, and sending an email when one of them stops answering. For that you are carrying a browser test suite. A selector changes, two checks go red, and someone spends an afternoon working out whether the alert was real. That is a tax on monitoring you did not need in the first place.',
      },
      {
        type: 'paragraph',
        text: 'Logdash does not do browser synthetics at all. It will not click a button, fill a form or run your specs, and there is no roadmap where it does. It hits a URL on a schedule, records the status code and the response time, keeps the history and messages you when that changes. If your monitoring-as-code repo is really four HTTP checks written in TypeScript, this is the smaller version of it. There is also a push monitor for the jobs that have no URL at all, so the nightly export ends up in the same list as the API.',
      },
      { type: 'heading', text: 'A health endpoint worth checking' },
      {
        type: 'code',
        language: 'typescript',
        title: 'health.ts',
        code: `// Return 200 only when the things you depend on are actually up.
app.get('/health', async (_req, res) => {
  try {
    await db.query('select 1');
    await redis.ping();
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Ship the endpoint',
            text: 'Deploy /health and confirm it returns 503 when the database is down, not a 200 with a sad message in the body.',
          },
          {
            title: 'Point a monitor at it',
            text: 'Add a service in Logdash, paste the URL, and it starts recording status codes and response times on your plan interval.',
          },
          {
            title: 'Attach Telegram',
            text: 'Connect a Telegram channel. The next check that does not come back 200 sends the alert to Telegram, and the response time chart shows whether it was already sliding.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Checkly',
        them: 'Checkly',
        rows: [
          {
            feature: 'Browser synthetics',
            logdash: 'Not built. No browser, no Playwright, ever.',
            them: 'Playwright checks in hosted runners',
            winner: 'them',
          },
          {
            feature: 'Assertions on the response',
            logdash: 'Status code and response time only',
            them: 'Assertions on body, headers and timing',
            winner: 'them',
          },
          {
            feature: 'Monitoring as code',
            logdash: 'Dashboard. No CLI, no Terraform provider.',
            them: 'CLI and Terraform provider, checks live in your repo',
            winner: 'them',
          },
          {
            feature: 'What you maintain',
            logdash: 'A URL and an interval',
            them: 'A test suite that has to stay green',
            winner: 'logdash',
          },
          {
            feature: 'Logs and metrics from your own app',
            logdash: 'Eight SDKs into the same project',
            them: 'Not what the product is for',
            winner: 'logdash',
          },
          {
            feature: 'Public status page',
            logdash: 'Public dashboard, custom domain on Pro',
            them: 'Public status pages',
            winner: 'tie',
          },
          {
            feature: 'Open source',
            logdash: 'MIT, full source on GitHub',
            them: 'Commercial SaaS, the CLI is open source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Checkly',
        reasons: [
          'You need to know that a real login, checkout or signup still works end to end. Logdash cannot tell you that, because it never opens a browser.',
          'Your checks belong in version control and in CI. Checkly has a CLI and a Terraform provider. Logdash has a dashboard.',
          'A 200 is not enough. An empty products array behind a healthy status code is still a bad day, and only an assertion catches it.',
          'You already have Playwright specs that work. Hosting them somewhere is a smaller decision than deciding you no longer need them.',
        ],
      },
      { type: 'heading', text: 'What migrating means here' },
      {
        type: 'paragraph',
        text: 'If your Checkly account is API checks on a handful of URLs, this is an afternoon: one service per URL, paste the URL, attach Telegram. If it is browser checks, do not migrate them, because there is nowhere for them to land. The split most teams settle on is Playwright for the two or three flows that make money and a plain HTTP monitor for everything else, and the second half should not cost what the first half costs. Before you cancel anything, look at which Checkly checks actually paged you in the last quarter. Usually it is the health endpoints, and the browser suite has been failing on selectors.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there an open source Checkly alternative?',
        answer:
          'Logdash is MIT licensed with the source on GitHub, but it is a different shape: HTTP monitoring, logs and metrics, no browser synthetics. If you want open source Playwright synthetics specifically, you are looking at running Playwright on your own CI, not at Logdash.',
      },
      {
        question: 'Does Logdash run Playwright tests?',
        answer:
          'No. It makes an HTTP request and records the status code and the response time. There is no browser and no test runner anywhere in it.',
      },
      {
        question: 'Can I self-host Logdash?',
        answer:
          'Not in production yet. It runs locally for development and a supported production install is open work on GitHub, so the hosted version is the real option today.',
      },
      {
        question: 'Can Logdash monitor cron jobs as well?',
        answer:
          'Yes. A push monitor gives you a URL your job POSTs to when it finishes, and the monitor goes down when a check window passes with no ping.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'statuscake',
    h1: 'StatusCake alternative for free uptime monitoring',
    answer:
      'The Logdash free plan gives every service one HTTP monitor checked every five minutes, Telegram and webhook alerts and a public status page, and it says plainly which parts are paid.',
    meta: {
      title: 'StatusCake alternative, free tier | Logdash',
      description:
        'The Logdash free plan: one HTTP monitor per service, five minute checks, Telegram and webhook alerts, a public status page. And where StatusCake wins.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Every free uptime plan has a shape. Somewhere in it there is a check interval, a monitor count, an alert channel that turns out to be paid, or a retention window that quietly makes the history useless. The question is never whether a free plan has limits. It is whether they are the limits you will hit.',
      },
      {
        type: 'paragraph',
        text: 'StatusCake has been doing this for a long time and its free plan is a real product, not a trial. It also has a wider catalogue than Logdash: SSL and domain expiry, page speed, keyword checks. Logdash has none of those. If the thing that worries you is a certificate expiring on a Saturday, StatusCake solves it today and Logdash does not.',
      },
      {
        type: 'paragraph',
        text: 'Here is the Logdash free plan without the marketing. Each service gets one HTTP monitor, checked every five minutes, recording status code and response time. Alerts go to Telegram or a webhook, both free, with no per-channel upsell. Your dashboard can be made public as a status page on a logdash.io URL, and a custom domain is on Pro. Logs and metrics arrive from the same SDK into the same project, with a day of log retention on free. Push monitors for cron jobs and faster check intervals are paid, and there is no free path to them.',
      },
      { type: 'heading', text: 'The endpoint the monitor will hit' },
      {
        type: 'code',
        language: 'python',
        title: 'main.py',
        code: `# FastAPI. Return 503 when a dependency is down so the monitor sees it.
@app.get("/health")
async def health():
    try:
        await db.execute("select 1")
    except Exception:
        return JSONResponse({"status": "degraded"}, status_code=503)

    return {"status": "ok"}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the service',
            text: 'Create a service in Logdash and give its monitor your health URL. The free plan checks it every five minutes.',
          },
          {
            title: 'Publish the status page',
            text: 'Make the dashboard public and you have a status page on a logdash.io URL. Custom domains are on the Pro plan.',
          },
          {
            title: 'Attach Telegram',
            text: 'Connect a Telegram channel to the monitor. The next check that does not come back 200 sends the alert to Telegram.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs StatusCake',
        them: 'StatusCake',
        rows: [
          {
            feature: 'Free HTTP monitoring',
            logdash: 'One monitor per service, five minute checks',
            them: 'A real free uptime plan, limits set by StatusCake',
            winner: 'tie',
          },
          {
            feature: 'Check types beyond HTTP',
            logdash: 'None. Status code and response time only.',
            them: 'SSL, domain expiry, page speed, keyword',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook, on every plan',
            them: 'Email plus a long integration list',
            winner: 'them',
          },
          {
            feature: 'Jobs that have no URL',
            logdash: 'Push monitors: the job POSTs to Logdash when it finishes',
            them: 'Checks reach out to a URL you own',
            winner: 'logdash',
          },
          {
            feature: 'Logs and metrics in the same project',
            logdash: 'Eight SDKs, one timeline with the uptime history',
            them: 'A monitoring product, not a log store',
            winner: 'logdash',
          },
          {
            feature: 'Public status page',
            logdash: 'Free, custom domain on Pro',
            them: 'Public reporting pages',
            winner: 'tie',
          },
          {
            feature: 'Open source',
            logdash: 'MIT, full source on GitHub',
            them: 'Commercial SaaS',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'StatusCake',
        reasons: [
          'You need SSL or domain expiry warnings. Logdash has neither, and an expired certificate is a real outage with a boring cause.',
          'You want page speed or keyword checks. Logdash records the status code and the response time and knows nothing about the page itself.',
          'Your alerts have to reach people who are not on Telegram and will not accept a webhook. That is most companies past about ten people.',
          'You want a vendor with a decade of operating history behind the uptime numbers. StatusCake has that and Logdash does not.',
        ],
      },
      { type: 'heading', text: 'What the free plan runs out of' },
      {
        type: 'paragraph',
        text: 'The five minute interval is the first wall. An outage can be nearly five minutes old before anyone hears about it, which is fine for a side project and not fine once someone is paying you. The second wall is heartbeats, because push monitors are paid, so free covers your API but not your cron. The third is retention: one day of logs, which is enough to debug this morning and not enough to work out what changed last Tuesday. None of that sits behind a sales call, and you can read all of it before you sign up. Free plans that hide the interval until you have wired up alerts are the ones to be careful with.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there an open source StatusCake alternative?',
        answer:
          'Logdash is MIT licensed with the source on GitHub. If what you want is to run the server yourself, Uptime Kuma is the more honest answer today, because Logdash self-hosting is not production ready.',
      },
      {
        question: 'Is Logdash actually free?',
        answer:
          'There is a free plan: one HTTP monitor per service, five minute checks, Telegram and webhook alerts, a public status page and a day of log retention. Faster checks, longer retention and push monitors are paid.',
      },
      {
        question: 'Are alerts included on the free plan?',
        answer:
          'Yes. Telegram and webhooks are both free, and they are also the only two channels on any plan.',
      },
      {
        question: 'Can I self-host Logdash?',
        answer:
          'Not for production yet. The repo runs locally for development and a proper install is open work tracked on GitHub.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'site24x7',
    h1: 'Site24x7 alternative for when you only wanted a few HTTP checks',
    answer:
      'Site24x7 is a full IT operations suite with dozens of monitor types and a licence to match, while Logdash does HTTP checks, cron heartbeats, logs and metrics, and takes about five minutes to stand up.',
    meta: {
      title: 'Site24x7 alternative for small teams | Logdash',
      description:
        'Site24x7 is an IT operations suite. If you wanted four HTTP checks and a Telegram alert, here is what Logdash does instead, and where Site24x7 still wins.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Site24x7 comes out of ManageEngine and it is built for the people who run infrastructure for a company: servers, VMs, network gear, applications, real user monitoring, log management, all under one licence priced by how many monitors and add-ons you buy. If that is your actual job, it is a serious product and it earns its console.',
      },
      {
        type: 'paragraph',
        text: 'It is a strange fit for three people with an API, a worker and a marketing site. You sign up wanting four HTTP checks and land in agent installers, thresholds, escalation policies and a monitor catalogue longer than your infrastructure. Nothing about it is broken. It is aimed at somebody else, and you pay for that in setup time and in the hour every quarter when you sit down and try to remember how it was configured. The tool ends up owned by whoever set it up, which in a small team means one person and a bus factor of one.',
      },
      {
        type: 'paragraph',
        text: 'Logdash has one shape. A service has a URL, the monitor hits it on a schedule, and it records the status code and the response time. Anything without a URL gets a push monitor and POSTs to Logdash when it finishes. Alerts go to Telegram or a webhook. Logs and metrics come from the same SDK into the same project, and the dashboard can be made public as a status page. Each service carries one monitor, so four checks means four services, which is how you would have grouped them anyway. There is no agent and nothing to size.',
      },
      { type: 'heading', text: 'What the monitor needs from your app' },
      {
        type: 'code',
        language: 'go',
        title: 'health.go',
        code: `// One handler, one dependency check, an honest status code.
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
	if err := db.PingContext(r.Context()); err != nil {
		http.Error(w, "degraded", http.StatusServiceUnavailable)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("{\\"status\\":\\"ok\\"}"))
})`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create one service per thing you watch',
            text: 'api, web, admin, worker. Anything with a URL gets a pull monitor. The worker gets a push monitor instead.',
          },
          {
            title: 'Paste the URLs',
            text: 'No agent, no host key, no collector to deploy. The monitors start recording status codes and response times on the next tick.',
          },
          {
            title: 'Point them all at Telegram',
            text: 'Attach one Telegram channel to all four monitors. The first check that comes back non-200 sends the alert to Telegram.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Site24x7',
        them: 'Site24x7',
        rows: [
          {
            feature: 'Monitor types',
            logdash: 'HTTP checks and push heartbeats',
            them: 'Servers, network devices, applications, RUM, synthetics and more',
            winner: 'them',
          },
          {
            feature: 'Agents to install',
            logdash: 'None. Nothing runs on your hosts.',
            them: 'Agents for server and infrastructure monitoring',
            winner: 'logdash',
          },
          {
            feature: 'Alerting and on-call',
            logdash: 'Telegram and webhook, no escalation',
            them: 'Long integration list, escalation and schedules',
            winner: 'them',
          },
          {
            feature: 'Signup to a working check',
            logdash: 'Minutes. One URL and an interval.',
            them: 'Longer, with more to configure first',
            winner: 'logdash',
          },
          {
            feature: 'Logs and metrics from your code',
            logdash: 'Eight SDKs into the same project',
            them: 'Log management and APM as their own modules',
            winner: 'tie',
          },
          {
            feature: 'SSO, audit trails and procurement',
            logdash: 'Not there',
            them: 'Built for exactly that buyer',
            winner: 'them',
          },
          {
            feature: 'Open source',
            logdash: 'MIT, full source on GitHub',
            them: 'Commercial suite',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Site24x7',
        reasons: [
          'You monitor servers, VMs or network gear. Logdash has no agent and never touches a host.',
          'You need on-call rotations and escalation. If nobody reads the Telegram message, Logdash does nothing else about it. Telegram is not a pager.',
          'Procurement needs SSO, an audit trail and a contract. That is a normal requirement and Logdash does not meet it.',
          'You would rather have one vendor than four. Four cheap tools do cost less, and they are worse at renewal time and worse in an audit.',
        ],
      },
      { type: 'heading', text: 'What moving looks like' },
      {
        type: 'paragraph',
        text: 'There is nothing to export. Uptime history does not transfer between vendors, and pretending otherwise is how people end up running two dashboards for a month. Create the services, paste the URLs, attach Telegram, and leave Site24x7 running in parallel until Logdash has caught something real. Then cancel. If you spend that month missing three of the monitor types, that is your answer and you should stay. The month in parallel is also the cheapest way to find out how many of your Site24x7 monitors were watching something that no longer exists.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a free Site24x7 alternative?',
        answer:
          'Logdash has a free plan: one HTTP monitor per service, five minute checks, Telegram and webhook alerts and a public status page. Faster checks and push monitors for cron jobs are paid.',
      },
      {
        question: 'Is there an open source Site24x7 alternative?',
        answer:
          'Logdash is MIT licensed and the source is on GitHub. For a full infrastructure suite you are closer to Zabbix or a Prometheus and Grafana stack, both of which are far more work to run.',
      },
      {
        question: 'Does Logdash monitor servers?',
        answer:
          'No. There is no agent and nothing to install on a host. It checks URLs, receives heartbeats from your jobs, and takes logs and metrics from your application code.',
      },
      {
        question: 'Can I self-host Logdash?',
        answer:
          'Not in production yet. It runs locally for development and a supported production install is tracked on GitHub, so the hosted version is the only real option today.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'freshping',
    h1: 'Freshping alternative for teams left without a monitor',
    answer:
      'Freshworks disabled Freshping free accounts on 6 March 2026 and deleted the data after 4 June 2026, so the migration is not optional, and Logdash covers the same HTTP checks, public status page and alerts on a free plan.',
    meta: {
      title: 'Freshping alternative after the shutdown | Logdash',
      description:
        'Freshworks shut Freshping down on 6 March 2026. Logdash replaces the HTTP checks, status page and alerts, and adds cron heartbeats, logs and metrics.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Freshping is gone. Freshworks disabled free accounts on 6 March 2026, stopped processing renewals the same day, and deleted account data once the export window closed on 4 June 2026. The deprecation FAQ put the reason plainly: supporting Freshping was no longer part of the go forward plan. There is no successor product inside Freshworks and nobody was migrated anywhere automatically.',
      },
      {
        type: 'paragraph',
        text: 'The free plan was genuinely good, which is why losing it stung. Fifty checks at one minute from ten locations, five public status pages with a custom domain, email and Slack alerts, SSL expiry warnings, all at no cost. Nothing on the market matches that for free, and Logdash does not either. Saying so up front is more useful than pretending the swap is like for like.',
      },
      {
        type: 'paragraph',
        text: 'What Logdash has that Freshping never did is the rest of the picture. The monitor, the application logs and the custom metrics all live under the same service, so a red check is one click from the log lines written in that minute instead of a second tool and a manual timestamp hunt. It is MIT licensed and the source is on GitHub.',
      },
      { type: 'heading', text: 'A health endpoint worth checking' },
      {
        type: 'code',
        language: 'javascript',
        title: 'health.js',
        code: `import express from 'express';
import { pool } from './db.js';

const app = express();

// Return 200 only when the dependencies answer. A monitor that
// checks the homepage tells you nginx is alive, nothing more.
app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});

app.listen(3000);`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Point a monitor at the endpoint',
            text: 'Create an HTTP monitor on the /health URL. Logdash records the status code and the response time on every run. The free plan checks every 5 minutes, Builder every minute, Pro every 15 seconds.',
          },
          {
            title: 'Rebuild the status page',
            text: 'Add the monitor to a public status page. That covers the Freshping page your customers had bookmarked. Serving it from your own domain is on the Pro plan.',
          },
          {
            title: 'Connect Telegram and prove it fires',
            text: 'Add a Telegram notification channel to the monitor, then stop the process. Within one check interval the alert arrives in Telegram with the URL and the status code.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Freshping as it last shipped',
        them: 'Freshping',
        rows: [
          {
            feature: 'Still running today',
            logdash: 'Yes',
            them: 'No, accounts disabled 6 March 2026',
            winner: 'logdash',
          },
          {
            feature: 'Free monitor count',
            logdash: '5 monitors, 5 minute checks',
            them: '50 checks at 1 minute, from 10 locations',
            winner: 'them',
          },
          {
            feature: 'Fastest check interval',
            logdash: '15 seconds on the $15 plan',
            them: '1 minute on every plan',
            winner: 'logdash',
          },
          {
            feature: 'Public status page',
            logdash: 'Included on every plan, custom domain on Pro',
            them: '5 pages with a custom domain, free',
            winner: 'tie',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook only',
            them: 'Email, SMS, Slack, Twilio, webhook',
            winner: 'them',
          },
          {
            feature: 'Cron and background job heartbeats',
            logdash: 'Push monitors, POST to a ping URL',
            them: 'Not offered',
            winner: 'logdash',
          },
          {
            feature: 'Logs and metrics beside the check',
            logdash: 'Eight SDKs into the same service view',
            them: 'Uptime only',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'another Freshping replacement',
        reasons: [
          'You relied on SSL expiry, DNS, TCP, UDP or ICMP checks. Freshping ran all of them. Logdash runs HTTP and push heartbeats, and none of the rest is built.',
          'You need email or SMS alerts. Logdash sends Telegram and webhook, and that is the entire list today, not a subset of a longer one.',
          'You were running thirty monitors on a zero budget. UptimeRobot and HetrixTools both hand out more free monitors than Logdash does.',
          'You want to own the whole stack. Uptime Kuma self-hosts in one container today. Logdash runs locally for development, and production self-hosting is still an open item tracked on GitHub.',
        ],
      },
      { type: 'heading', text: 'What the migration actually costs' },
      {
        type: 'paragraph',
        text: 'If you exported before the deadline you have a CSV of checks and incident history. No vendor imports it, Logdash included, so the move is retyping URLs. Fifty monitors is an afternoon and five is ten minutes. Historical uptime percentages do not transfer anywhere either, so treat 6 March as the start of a fresh record rather than something to preserve.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is Freshping really shut down?',
        answer:
          'Yes. Freshworks disabled free plan accounts on 6 March 2026, stopped renewing paid subscriptions from the same date, and permanently deleted data after the export window. The deprecation FAQ is still published on the Freshping support site.',
      },
      {
        question: 'Does Logdash have a free tier?',
        answer:
          'Yes. The free plan covers 5 monitors at a 5 minute check interval, one public status page, logs and metrics. It does not need a card.',
      },
      {
        question: 'Can I get alerts without email?',
        answer:
          'Yes, and you have to. Logdash only sends Telegram messages and webhooks. There is no email alerting today, which is the opposite trade from Freshping.',
      },
      {
        question: 'How fast can the check interval be?',
        answer:
          '5 minutes on the free plan, 1 minute on Builder at $9 a month, 15 seconds on Pro at $15. Freshping was 1 minute on every plan including the free one.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'hyperping',
    h1: 'Hyperping alternative for logs and uptime in one place',
    answer:
      'Hyperping is a well built uptime and status page product, and Logdash is the alternative when you want the logs and metrics from the failing service on the same screen as the failed check, starting at $9 a month instead of $29.',
    meta: {
      title: 'Hyperping alternative with logs and metrics | Logdash',
      description:
        'Hyperping does uptime and status pages well. Logdash puts the logs and metrics for that service next to the check, with cron heartbeats, from $9 a month.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Hyperping is good software. The status pages look right without configuration, the check coverage is broad, and there is a Terraform provider if you want monitors in version control. If you are happy paying for it, this page is not an argument to stop. Most people who leave are not leaving because something broke.',
      },
      {
        type: 'paragraph',
        text: 'They leave because Hyperping stops at the edge of the check. It tells you the endpoint returned 503 at 03:14 and it tells you fast. Then you open a log tool, find the right service, scroll to 03:14 and start reading. That second hop is the whole job at three in the morning, and it is the part no uptime product solves by adding another check protocol.',
      },
      {
        type: 'paragraph',
        text: 'Logdash puts both in one service view. The monitor with its status codes and response times, the application logs streaming in from the SDK, and any counters you register, all under the same service. The price shape is different too. Hyperping is free for 20 monitors at 5 minute checks, then $29 a month for 30 second checks and a status page on your own domain. Logdash is $9 for one minute checks and $15 for 15 second checks with a custom domain.',
      },
      { type: 'heading', text: 'A health endpoint the check can hit' },
      {
        type: 'code',
        language: 'go',
        title: 'health.go',
        code: `package main

import (
	"encoding/json"
	"net/http"
)

// 503 when a dependency is down, 200 otherwise. Keep it cheap:
// this runs every 15 seconds forever.
func health(w http.ResponseWriter, r *http.Request) {
	if err := db.PingContext(r.Context()); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"status": "degraded"})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	http.HandleFunc("/health", health)
	http.ListenAndServe(":8080", nil)
}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create the monitor',
            text: 'Add an HTTP monitor on the /health URL inside the service it belongs to. Logdash stores the status code and response time for every check.',
          },
          {
            title: 'Send logs from the same service',
            text: 'Drop in the SDK for your language. Node, Python, Ruby, Java, .NET, Go, Rust and PHP are covered. Now the check and the log lines share a timeline.',
          },
          {
            title: 'Wire up Telegram',
            text: 'Attach a Telegram channel to the monitor and take the service down on purpose. The alert lands in Telegram, and the logs from that same minute are already in the service view when you tap through.',
          },
        ],
      },
      {
        type: 'comparison',
        them: 'Hyperping',
        rows: [
          {
            feature: 'Check types',
            logdash: 'HTTP and push heartbeats',
            them: 'HTTP, TCP, ICMP, DNS, SSL, keyword and browser checks',
            winner: 'them',
          },
          {
            feature: 'Free plan',
            logdash: '5 monitors, 5 minute checks, 1 status page',
            them: '20 monitors, 5 minute checks, 1 status page',
            winner: 'them',
          },
          {
            feature: 'Alert channels',
            logdash: 'Telegram and webhook only',
            them: 'Email, Slack, Teams, PagerDuty, SMS, phone calls',
            winner: 'them',
          },
          {
            feature: 'Cron and background job heartbeats',
            logdash: 'POST to a ping URL, no auth header, no body',
            them: 'Heartbeat URLs with a grace window',
            winner: 'tie',
          },
          {
            feature: 'Cheapest plan with a custom status page domain',
            logdash: '$15 a month',
            them: '$29 a month, or $24 billed annually',
            winner: 'logdash',
          },
          {
            feature: 'Application logs for the monitored service',
            logdash: 'Eight SDKs into the same service view',
            them: 'Not offered',
            winner: 'logdash',
          },
          {
            feature: 'Source available',
            logdash: 'MIT on GitHub',
            them: 'Closed source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Hyperping',
        reasons: [
          'You need on-call rotations and escalation policies. Hyperping schedules them and will ring a phone. Logdash sends a Telegram message and a webhook, then stops.',
          'You need SSL expiry, DNS, TCP or keyword checks. Hyperping runs all four. Logdash checks HTTP and receives heartbeats, and nothing else exists.',
          'You want Playwright browser checks that walk through a login flow. Logdash has no synthetic browser testing at all.',
          'Twenty free monitors beats five. If the free tier is your whole plan, take the bigger one.',
        ],
      },
      { type: 'heading', text: 'What moving actually involves' },
      {
        type: 'paragraph',
        text: 'Uptime history does not migrate between vendors, so run both for a week and cut over when you trust the new alerts. Recreate the monitors by hand, point your status page CNAME at Logdash, and keep the Hyperping status page live until DNS has settled. The part that takes real time is adding the SDK to each service, and that is also the only part that changes how you debug.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is Logdash cheaper than Hyperping?',
        answer:
          'For a small team, yes. Logdash is $9 a month for one minute checks and $15 for 15 second checks with a custom status page domain. Hyperping starts at $29 a month for 30 second checks, or $24 billed annually.',
      },
      {
        question: 'Does Logdash do status pages?',
        answer:
          'Yes. Every plan includes public status pages, and Pro serves them from your own domain. They are not as configurable as Hyperping status pages.',
      },
      {
        question: 'Can I monitor cron jobs like Hyperping heartbeats?',
        answer:
          'Yes. Create a push monitor and have the job send POST https://api.logdash.io/ping/<httpMonitorId> when it finishes. No auth header and no body. Miss the window and the monitor goes down.',
      },
      {
        question: 'Can I get alerts without email?',
        answer:
          'That is the only option. Logdash sends Telegram and webhook alerts and has no email or SMS channel, so a webhook is the escape hatch if you need something else.',
      },
      {
        question: 'Can I self-host Logdash instead?',
        answer:
          'Not properly yet. The code is MIT and runs locally for development, but a production self-host is not a one command install and is still tracked as open work on GitHub.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'updown-io',
    h1: 'updown.io alternative for more than uptime',
    answer:
      'updown.io is a deliberately tiny pay-per-check monitor that does its one job well, and Logdash is the alternative when you want logs, custom metrics and cron heartbeats for the same service instead of a credit balance and a very small dashboard.',
    meta: {
      title: 'updown.io alternative for logs and uptime | Logdash',
      description:
        'updown.io does pay-per-check uptime and does it well. Logdash adds application logs, custom metrics and cron heartbeats beside the check, on a flat plan.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'updown.io is one of the very few tools that stayed small on purpose. Five euros buys 200,000 checks. There are no seats, no onboarding call and no upsell banner. It checks HTTP, TCP and ICMP, warns you on TLS certificate and domain expiry, runs anywhere from every 15 seconds to every hour, and confirms downtime from a second location before it wakes you up. If that list is your whole requirement, stay where you are.',
      },
      {
        type: 'paragraph',
        text: 'People move for one reason, and it is not quality. updown.io is a single layer. It tells you the request failed and how long it took. It cannot tell you what the process was doing when it failed, because it never had that data. So the check fires, and the next thing you do is open something else.',
      },
      {
        type: 'paragraph',
        text: 'Logdash keeps the check and the evidence together. The HTTP monitor, the application logs and the counters you register all sit under one service, so the alert and the stack trace are two seconds apart instead of two tools apart. SDKs exist for Node, Python, Ruby, Java, .NET, Go, Rust and PHP. The whole thing is MIT licensed.',
      },
      { type: 'heading', text: 'A health endpoint the monitor can hit' },
      {
        type: 'code',
        language: 'python',
        title: 'health.py',
        code: `from fastapi import FastAPI, Response
from sqlalchemy import text

app = FastAPI()


# Cheap, dependency-aware, no auth. The monitor gets a status code
# and a response time, and both are worth graphing.
@app.get("/health")
async def health(response: Response):
    try:
        async with engine.connect() as conn:
            await conn.execute(text("select 1"))
        return {"status": "ok"}
    except Exception:
        response.status_code = 503
        return {"status": "degraded"}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the HTTP monitor',
            text: 'Create a monitor on /health inside the service it belongs to. Status code and response time are recorded on every run, at 5 minutes on the free plan and down to 15 seconds on Pro.',
          },
          {
            title: 'Cover the jobs updown.io pulses',
            text: 'For anything without a public URL, create a push monitor and POST to https://api.logdash.io/ping/<httpMonitorId> at the end of the job. No auth header, no body.',
          },
          {
            title: 'Add Telegram and break something',
            text: 'Attach a Telegram channel, then stop the service or skip a cron run. The alert reaches Telegram on the next interval, and the logs from that minute are already sitting under the same service.',
          },
        ],
      },
      {
        type: 'comparison',
        them: 'updown.io',
        rows: [
          {
            feature: 'Pricing model',
            logdash: 'Flat, $9 or $15 a month',
            them: 'Pay per check, credits from 5 euros',
            winner: 'them',
          },
          {
            feature: 'Check types',
            logdash: 'HTTP and push heartbeats only',
            them: 'HTTP, TCP, ICMP, plus TLS and domain expiry alerts',
            winner: 'them',
          },
          {
            feature: 'Fastest check interval',
            logdash: '15 seconds on Pro',
            them: '15 seconds',
            winner: 'tie',
          },
          {
            feature: 'Cron and background job heartbeats',
            logdash: 'Push monitors, POST to a ping URL',
            them: 'Pulse checks',
            winner: 'tie',
          },
          {
            feature: 'Application logs from the failing service',
            logdash: 'Eight SDKs into the same service view',
            them: 'Not offered',
            winner: 'logdash',
          },
          {
            feature: 'Custom application metrics',
            logdash: 'Counters and gauges with charts',
            them: 'Not offered',
            winner: 'logdash',
          },
          {
            feature: 'Source available',
            logdash: 'MIT on GitHub',
            them: 'Not public, but the API is documented',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'updown.io',
        reasons: [
          'You want the smallest possible bill. Three checks every five minutes costs a few euros a year on updown.io. Paid Logdash is $9 a month whether you use it or not.',
          'You need TLS certificate or domain expiry alerts. Logdash checks neither, and I am not going to promise you a date for either one.',
          'You monitor over IPv4 and IPv6 and want them reported separately. updown.io does dual-stack checks at no extra cost. Logdash does not split the two.',
          'You like an interface that is almost nothing. That is a real preference and updown.io serves it better than anything else on the market.',
        ],
      },
      { type: 'heading', text: 'What moving actually involves' },
      {
        type: 'paragraph',
        text: 'Pull your checks out with the updown.io API, recreate them as Logdash monitors, and leave the remaining credits burning for a week while you compare. Uptime history stays behind, as it does with every vendor swap. The real work is adding the SDK to each service, and if you skip that step you have moved for nothing, because the check on its own is something updown.io already did well.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Logdash have a free tier?',
        answer:
          'Yes. Five monitors at a 5 minute interval, one public status page, plus logs and metrics, with no card. updown.io has no free tier but its paid usage is measured in cents.',
      },
      {
        question: 'How fast can the check interval be?',
        answer:
          '5 minutes on the free plan, 1 minute at $9 a month and 15 seconds at $15. updown.io reaches 15 seconds too, and you pay per check for it.',
      },
      {
        question: 'Does Logdash do status pages?',
        answer:
          'Yes, public status pages are on every plan, and the Pro plan serves them from a domain you own.',
      },
      {
        question: 'Can I get alerts without email?',
        answer:
          'Yes. Logdash only sends Telegram messages and webhooks. There is no email channel at all, so if you want Slack or Discord you route the webhook there yourself.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'hetrixtools',
    h1: 'HetrixTools alternative for uptime without the server agents',
    answer:
      'HetrixTools bundles uptime checks with IP blacklist monitoring and Linux server agents, and Logdash does neither of those, so it is only the right swap if what you actually use is the HTTP checks, the status page and the alerts.',
    meta: {
      title: 'HetrixTools alternative for HTTP uptime | Logdash',
      description:
        'Logdash has no blacklist monitoring and no server agent. It does HTTP checks, cron heartbeats, status pages, plus logs and metrics for the same service.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Start with what Logdash does not do, because on this comparison it matters more than anything else. There is no IP or domain blacklist monitoring. There is no server agent reporting CPU, RAM, disk or network from your boxes. There are no SSL expiry, DNS, TCP or ICMP checks either. HetrixTools does all of that, has done since 2015, and if any of it is why you signed up then stop here and stay.',
      },
      {
        type: 'paragraph',
        text: 'The people who do move are the ones running the uptime half and nothing else. They took the free 15 monitors, never installed the agent, and have never sent a marketing email in their lives. For that group HetrixTools is a box that says up or down, and a box that says up or down is a solved problem that half a dozen tools give away.',
      },
      {
        type: 'paragraph',
        text: 'Logdash is worth the swap for that group because the check is not the product. Application logs and custom metrics from the same service sit next to the monitor, so the alert and the reason for the alert are on one screen. Cron jobs get push heartbeats. It is MIT licensed, and the source is on GitHub if you want to read what is actually running.',
      },
      { type: 'heading', text: 'A health endpoint the monitor can hit' },
      {
        type: 'code',
        language: 'php',
        title: 'health.php',
        code: `<?php
// Answer 200 only when the database answers. Cheap enough to run
// every minute, honest enough to page on.
header('Content-Type: application/json');

try {
    $pdo = new PDO(getenv('DATABASE_DSN'), getenv('DB_USER'), getenv('DB_PASS'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 2,
    ]);
    $pdo->query('select 1');

    http_response_code(200);
    echo json_encode(['status' => 'ok']);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['status' => 'degraded']);
}`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Recreate the uptime monitors',
            text: 'Add an HTTP monitor per URL. Logdash records the status code and the response time on every check, at 5 minutes free, 1 minute on Builder and 15 seconds on Pro.',
          },
          {
            title: 'Cover the cron jobs the agent never watched',
            text: 'Create a push monitor for each scheduled job and POST to https://api.logdash.io/ping/<httpMonitorId> when it completes. No auth header, no body. A missed window marks the monitor down.',
          },
          {
            title: 'Point the alerts at Telegram',
            text: 'Attach a Telegram channel to each monitor, then take one service offline. The alert arrives in Telegram naming the monitor and the status code, and the logs from that minute are already under the same service.',
          },
        ],
      },
      {
        type: 'comparison',
        them: 'HetrixTools',
        rows: [
          {
            feature: 'IP and domain blacklist monitoring',
            logdash: 'Not offered and not planned',
            them: 'Dozens of blocklists, included free',
            winner: 'them',
          },
          {
            feature: 'Linux server resource agent',
            logdash: 'Not offered',
            them: 'CPU, RAM, disk, network and processes',
            winner: 'them',
          },
          {
            feature: 'Free uptime monitors',
            logdash: '5 monitors at 5 minute checks',
            them: '15 monitors at 1 minute checks',
            winner: 'them',
          },
          {
            feature: 'Public status page',
            logdash: 'Included on every plan, custom domain on Pro',
            them: 'Included, free plan too',
            winner: 'tie',
          },
          {
            feature: 'Cron and background job heartbeats',
            logdash: 'Push monitors, POST to a ping URL',
            them: 'Not offered',
            winner: 'logdash',
          },
          {
            feature: 'Application logs and custom metrics',
            logdash: 'Eight SDKs into the same service view',
            them: 'Host stats only, nothing from your code',
            winner: 'logdash',
          },
          {
            feature: 'Source available',
            logdash: 'MIT on GitHub',
            them: 'Closed source',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'HetrixTools',
        reasons: [
          'You send email at volume. Blacklist monitoring across the major blocklists is the reason HetrixTools exists, and Logdash has no equivalent now or later.',
          'You run Linux boxes and need CPU, RAM and disk alerts from them. The HetrixTools agent collects host stats. Logdash charts metrics your code pushes, which is not the same job.',
          'Fifteen free monitors at one minute beats five at five minutes. If you are paying nobody, the HetrixTools free plan is simply larger.',
          'You resell monitoring under your own brand. HetrixTools supports that workflow and Logdash does not.',
        ],
      },
      { type: 'heading', text: 'What moving actually involves' },
      {
        type: 'paragraph',
        text: 'The honest version is that most people should run both. Keep HetrixTools for blacklist and host monitoring, which nothing here replaces, and move the HTTP checks to Logdash so they sit beside the logs. If you are dropping HetrixTools entirely, you are also dropping blacklist alerts and agent metrics, so decide that on purpose rather than discovering it the week a mail server gets listed.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Logdash do blacklist monitoring?',
        answer:
          'No. There is no IP or domain blacklist checking in Logdash and none is planned. If that is why you use HetrixTools, keep the account.',
      },
      {
        question: 'Does Logdash have a server monitoring agent?',
        answer:
          'No. Logdash collects metrics your application sends through an SDK. It does not install an agent and it does not read CPU, RAM or disk from your hosts.',
      },
      {
        question: 'Does Logdash have a free tier?',
        answer:
          'Yes, 5 monitors at a 5 minute check interval with one public status page, logs and metrics included. HetrixTools gives 15 uptime monitors at one minute for free, which is more.',
      },
      {
        question: 'Can I get alerts without email?',
        answer:
          'Yes. Telegram and webhook are the only two channels Logdash has, so email is not even an option. Anything else has to go through the webhook.',
      },
      {
        question: 'Can I self-host it?',
        answer:
          'Not in production yet. Logdash is MIT licensed and runs locally for development, but a supported self-hosted deployment is still open work tracked on GitHub.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'gatus',
    h1: 'Gatus alternative for teams who do not want to host the monitor',
    answer:
      'Logdash runs the HTTP checks from our infrastructure instead of from a container you keep alive, so you trade a YAML file in git for a monitor that does not go down with the host it is watching.',
    meta: {
      title: 'Gatus alternative without self-hosting | Logdash',
      description:
        'Gatus is excellent and its YAML config is a real advantage. Here is where a hosted checker wins instead, and the checks Gatus does that Logdash does not.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Gatus is good software. You describe checks in YAML, it evaluates them on an interval, and the whole thing is one binary with SQLite behind it if you want history. People rarely leave because the tool disappointed them. They leave because the monitor became a service, and a monitor that dies quietly is worse than no monitor.',
      },
      {
        type: 'paragraph',
        text: 'That is the failure mode worth naming. The Gatus container shares a host with the app it watches, the host goes down, and both go with it. Or the volume fills and history stops being written. Nobody finds out, because the thing that would have told you is the thing that broke. Moving Gatus to its own box fixes that and hands you a second deployment to patch.',
      },
      {
        type: 'paragraph',
        text: 'Logdash checks your endpoints from outside your network. There is no config file, which is a genuine loss: no diff, no review, no config in git. What you get is an HTTP monitor with a URL, an interval, status code and response time history, a public status page on your own domain, and alerts to Telegram or a webhook. Two channels, not forty. Gatus ships providers for PagerDuty, Opsgenie, Slack and email, and Logdash does not.',
      },
      {
        type: 'paragraph',
        text: 'Be clear about the rest of the gap. Logdash checks HTTP status codes and response time. Certificate expiry, domain expiry, DNS, TCP and ICMP are all things Gatus does and Logdash does not. And while Logdash is MIT licensed with the source on GitHub, self-hosting is not a one-command install today. It runs locally for development, and production self-hosting is tracked as an open issue. If self-hosting is the whole point, Gatus wins and you should stay on it.',
      },
      { type: 'heading', text: 'The endpoint both tools check' },
      {
        type: 'code',
        language: 'go',
        title: 'health.go',
        code: `func health(w http.ResponseWriter, r *http.Request) {
	if err := db.PingContext(r.Context()); err != nil {
		http.Error(w, "database unreachable", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "up"})
}`,
      },
      {
        type: 'paragraph',
        text: 'Gatus points at that with an endpoints entry, an interval and a condition on the status code. Logdash asks for the same three things in a form. The endpoint does not change, so you can run both against it for a week before you turn either one off.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the monitor',
            text: 'Paste the health URL and pick an interval. The first check runs immediately, so within seconds you know whether the URL answers from outside your own network.',
          },
          {
            title: 'Publish the status page',
            text: 'Switch the monitor onto a public page and map your own domain to it. Uptime and response time history start filling in from the first check.',
          },
          {
            title: 'Connect Telegram',
            text: 'Attach a Telegram channel and stop the container on purpose. The check fails, and the alert lands in your chat with the URL and the status code.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Gatus',
        them: 'Gatus',
        rows: [
          {
            feature: 'Who keeps the monitor running',
            logdash: 'We do',
            them: 'You do, along with its storage',
            winner: 'logdash',
          },
          {
            feature: 'Public status page',
            logdash: 'Hosted page on your own domain',
            them: 'Expose the Gatus dashboard yourself',
            winner: 'logdash',
          },
          {
            feature: 'Logs and metrics',
            logdash: 'Same dashboard, eight SDKs',
            them: 'Uptime only, by design',
            winner: 'logdash',
          },
          {
            feature: 'Config as code',
            logdash: 'Browser form, no file',
            them: 'YAML in git, reviewed like code',
            winner: 'them',
          },
          {
            feature: 'Self-hosting',
            logdash: 'Local development only today',
            them: 'One binary, SQLite or Postgres',
            winner: 'them',
          },
          {
            feature: 'Check types',
            logdash: 'HTTP status and response time',
            them: 'Adds DNS, TCP, ICMP, certificate and domain expiry',
            winner: 'them',
          },
          {
            feature: 'Open source',
            logdash: 'MIT',
            them: 'Apache 2.0',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Gatus',
        reasons: [
          'Your checks belong in git. A YAML file that goes through review is a better artefact than a row in a database you do not own.',
          'You need certificate expiry, domain expiry, DNS, TCP or ICMP checks. Logdash does HTTP and nothing else.',
          'You need to self-host in production today. Gatus does that, Logdash does not.',
          'You already page through PagerDuty or Opsgenie. Gatus has providers for both; Logdash has Telegram and webhooks.',
        ],
      },
      { type: 'heading', text: 'What moving actually looks like' },
      {
        type: 'paragraph',
        text: 'Read the endpoints block out of your config and recreate each url and interval as a monitor. Leave Gatus running while you do it, watch both for a week, then compare the two incident timelines and delete the one you trust less. Anything Gatus watches that is not HTTP has no equivalent here, so keep a small instance around for those.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a hosted version of Gatus?',
        answer:
          'Yes. Gatus.io is a managed offering from the same author, so you can keep the tool and drop the container. Logdash is a different product with logs and metrics attached, not a hosted Gatus.',
      },
      {
        question: 'Is Logdash open source like Gatus?',
        answer:
          'Yes, MIT licensed with the source on GitHub. The difference is production self-hosting: Gatus ships a binary you can run today, Logdash runs locally for development and the rest is tracked on GitHub.',
      },
      {
        question: 'Can I import my gatus.yaml?',
        answer:
          'No, there is no importer. You recreate each endpoint as an HTTP monitor by hand. For most setups that is a ten minute job.',
      },
      {
        question: 'Does Logdash check SSL certificate expiry like Gatus?',
        answer:
          'No. Logdash checks HTTP status codes and response time and accepts push heartbeats. Certificate expiry, domain expiry, DNS, TCP and ICMP are Gatus-only.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'upptime',
    h1: 'Upptime alternative for checks more often than every five minutes',
    answer:
      'Upptime is capped by GitHub Actions cron, which will not schedule below five minutes and can run late when the runners are busy, so Logdash runs the checks on its own schedule instead - though Upptime stays free at any scale and Logdash does not.',
    meta: {
      title: 'Upptime alternative, faster checks | Logdash',
      description:
        'Upptime is a clever hack that works. The five-minute Actions cron floor and the commits in your repo are the two reasons people move. Here is the trade.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Upptime is a good trick. A scheduled GitHub Action curls your URLs, commits the result, opens an issue when something is down and closes it when it recovers. No server, no bill, and the whole history sits in a repo you own. For a side project that is hard to beat, and you should not switch off it out of taste.',
      },
      {
        type: 'paragraph',
        text: 'It runs out of road in two places. The first is the schedule. GitHub Actions cron does not accept anything finer than five minutes, and scheduled workflows are queued rather than guaranteed, so during busy periods they start late. Real detection time is five minutes plus whatever the queue is doing. A two minute outage can pass without a single failed check, and you find out from a customer.',
      },
      {
        type: 'paragraph',
        text: 'The second is the repository. The workflows commit their results back, and every incident is a GitHub issue. The commit graph and the issue list stop being a record of your work. If you watch that repo, monitoring noise arrives in the same inbox as pull requests, and the thing you actually wanted - response time over the last month - is spread across thousands of commits.',
      },
      {
        type: 'paragraph',
        text: 'Logdash runs the checks itself on the interval you set and keeps the history without committing anything. Two things Upptime has that Logdash does not: it is free at any scale, and it is genuinely yours. Logdash has a free Hobby plan with paid tiers above it, and while it is MIT licensed, production self-hosting is not a one-command install yet. It runs locally for development and the rest is tracked on GitHub.',
      },
      { type: 'heading', text: 'Heartbeat from the Action you already have' },
      {
        type: 'code',
        language: 'yaml',
        title: '.github/workflows/nightly.yml',
        code: `jobs:
  nightly-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./bin/nightly-sync

      - name: Heartbeat
        run: curl -fsS -X POST https://api.logdash.io/ping/<monitorId>`,
      },
      {
        type: 'paragraph',
        text: 'That endpoint is public and takes no body and no auth header. If the job stops running, or fails before it reaches the last step, the heartbeat never arrives and the monitor goes down. Upptime cannot watch a job that has no URL.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Copy the sites list out of .upptimerc.yml',
            text: 'Each url becomes one HTTP monitor. Set the interval you actually wanted instead of the five minute floor you were living with.',
          },
          {
            title: 'Turn on the public status page',
            text: 'Add the monitors to a page and point your own domain at it. That replaces the GitHub Pages site, and nothing has to build on push.',
          },
          {
            title: 'Attach Telegram',
            text: 'Connect a Telegram channel to each monitor. The next time an endpoint returns a 5xx, the alert is in your chat instead of being an issue notification you will read tomorrow.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Upptime',
        them: 'Upptime',
        rows: [
          {
            feature: 'Minimum check interval',
            logdash: 'The interval you set on the monitor',
            them: 'Five minutes, and Actions cron can start late',
            winner: 'logdash',
          },
          {
            feature: 'Cron and background jobs',
            logdash: 'POST a heartbeat to a monitor URL',
            them: 'Not covered, Upptime pulls URLs',
            winner: 'logdash',
          },
          {
            feature: 'Logs and metrics',
            logdash: 'Same dashboard, eight SDKs',
            them: 'Uptime only',
            winner: 'logdash',
          },
          {
            feature: 'Cost',
            logdash: 'Free Hobby plan, paid tiers above it',
            them: 'Free, on your own Actions minutes',
            winner: 'them',
          },
          {
            feature: 'Self-hosting',
            logdash: 'Local development only today',
            them: 'Runs entirely in a repo you own',
            winner: 'them',
          },
          {
            feature: 'Where incidents live',
            logdash: 'Incident timeline in the dashboard',
            them: 'GitHub issues, commentable and searchable',
            winner: 'tie',
          },
          {
            feature: 'Status page',
            logdash: 'Hosted page on your own domain',
            them: 'GitHub Pages site you style and deploy',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Upptime',
        reasons: [
          'The bill is zero and it stays zero. If cost is the constraint, nothing here competes.',
          'Everything lives in a repo you control. No account to lose, no vendor to outlive.',
          'Five minutes is fine for most side projects. If nobody is woken up at 3am, the floor does not matter.',
          'You want the status page in your own GitHub organisation, styled by you and deployed by you.',
        ],
      },
      { type: 'heading', text: 'What moving actually looks like' },
      {
        type: 'paragraph',
        text: 'Keep the repo. Recreate the sites list as monitors and run both for a week, which is usually enough to show you the gaps where the five minute grid missed something. When you are convinced, disable the workflows and archive the repo rather than deleting it. Nothing imports your old issues, so that archive is your incident history.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a free alternative to Upptime?',
        answer:
          'Logdash has a free Hobby plan covering monitors, alerts and a status page. Upptime is free at any scale because it runs on your own GitHub Actions minutes, so if cost is the deciding factor Upptime wins.',
      },
      {
        question: 'Can Upptime check more often than every five minutes?',
        answer:
          'Not reliably. GitHub Actions cron will not schedule below five minutes, and scheduled workflows can be delayed when runners are busy.',
      },
      {
        question: 'Is Logdash self-hosted like Upptime?',
        answer:
          'Not in production yet. The code is MIT and runs locally for development, and production self-hosting is tracked on GitHub. Upptime is genuinely yours today and that is a real difference.',
      },
      {
        question: 'What happens to my GitHub issues and status history?',
        answer:
          'They stay in the repo. Nothing imports them into Logdash, so archive the repository instead of deleting it if that incident history matters to you.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'instatus',
    h1: 'Instatus alternative for monitoring and status pages in one bill',
    answer:
      'Logdash treats the public page as a view of monitors you are already running, so the checks, the alerts and the page are one subscription rather than a status page with monitoring bolted on beside it.',
    meta: {
      title: 'Instatus alternative with monitoring | Logdash',
      description:
        'You bought a status page and ended up buying uptime monitoring too. Logdash starts from the monitors. Here is the trade, including where Instatus wins.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Most people arrive at Instatus for the page. Something broke, support got flooded, and you wanted one URL to point customers at. The page is genuinely good. It loads fast, subscribers work, and incident templates save you writing the same sentence twice at 3am.',
      },
      {
        type: 'paragraph',
        text: 'Then you notice the page knows nothing on its own. Something has to decide the API is down. So you add Instatus monitors, and the status page you bought for one bad afternoon is now also your uptime tool, on a plan sized by monitor count and check frequency.',
      },
      {
        type: 'paragraph',
        text: 'Logdash starts from the other end. You add HTTP monitors because you want to know when something breaks. The public page is a switch on the monitors you already have, on your own domain, in the same subscription. Alerts go to Telegram or a webhook, and those two are the entire list. No SMS, no phone calls, no on-call rotation.',
      },
      {
        type: 'paragraph',
        text: 'The rest of the difference is scope in both directions. Logdash also carries logs and metrics from eight SDKs, so the request that failed and the check that caught it sit in one dashboard. Instatus does not do logs. Going the other way, Instatus checks things Logdash cannot: ping, TCP, UDP and DNS. Logdash does HTTP status and response time plus push heartbeats for cron jobs, and that is where the list ends.',
      },
      { type: 'heading', text: 'The endpoint the monitor calls' },
      {
        type: 'code',
        language: 'python',
        title: 'main.py',
        code: `from fastapi import FastAPI, Response

app = FastAPI()


@app.get("/health")
def health(response: Response):
    if not database.reachable():
        response.status_code = 503
        return {"status": "down", "reason": "database"}

    return {"status": "ok"}`,
      },
      {
        type: 'paragraph',
        text: 'Cron jobs work the other way round. Instead of Logdash calling you, the job calls Logdash: a POST to https://api.logdash.io/ping/<monitorId> when it finishes. The endpoint is public, takes no body and no auth header, so it is one curl at the end of a script. If the job stops running, the heartbeat stops arriving and the monitor goes down. Instatus has cron monitors too, so this is not a reason to move on its own. It is a reason you lose nothing if you do.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the monitor',
            text: 'Paste the health URL and pick an interval. The first check runs straight away, so you find out in seconds if the endpoint does not answer from outside.',
          },
          {
            title: 'Publish the page',
            text: 'Turn the monitor on for a public status page and map your own domain. Uptime and response time come from the checks you are already paying for.',
          },
          {
            title: 'Wire the alert',
            text: 'Attach a Telegram channel, then return a 503 from the health endpoint on purpose. The alert arrives in the chat while you are still watching the tab.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Instatus',
        them: 'Instatus',
        rows: [
          {
            feature: 'What the product is built around',
            logdash: 'Monitors first, the page is a view of them',
            them: 'The page first, monitors added beside it',
            winner: 'logdash',
          },
          {
            feature: 'Logs and metrics',
            logdash: 'Same dashboard, eight SDKs',
            them: 'Not covered',
            winner: 'logdash',
          },
          {
            feature: 'Open source',
            logdash: 'MIT, source on GitHub',
            them: 'Closed source',
            winner: 'logdash',
          },
          {
            feature: 'Custom domain on the page',
            logdash: 'Point your own domain at it',
            them: 'Point your own domain at it',
            winner: 'tie',
          },
          {
            feature: 'Check types',
            logdash: 'HTTP and push heartbeats',
            them: 'Adds ping, TCP, UDP and DNS',
            winner: 'them',
          },
          {
            feature: 'Telling your customers',
            logdash: 'The page updates, nothing is sent',
            them: 'Email and SMS subscribers, on-call schedules',
            winner: 'them',
          },
          {
            feature: 'Writing the incident',
            logdash: 'Type the update on the page',
            them: 'Templates and scheduled maintenance',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Instatus',
        reasons: [
          'The page is what your customers judge you on, and Instatus has spent years on exactly that page. Subscribers, templates and scheduled maintenance are all there and tested.',
          'You need to check something that is not HTTP. Ping, TCP, UDP and DNS monitors exist there and do not exist here.',
          'Your incident process involves an SMS or a phone call. Logdash sends Telegram messages and webhooks, nothing else.',
        ],
      },
      { type: 'heading', text: 'What moving actually looks like' },
      {
        type: 'paragraph',
        text: 'Recreate the monitors first and leave the Instatus page live. Run both for a week so you can compare what each one caught and how quickly. Then publish the Logdash page on a subdomain, and only redirect the customer-facing URL once you are happy. Give subscribers notice before you do, because the subscriber list does not come with you and the people who most need the page are the ones who will not read the announcement.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a free alternative to Instatus?',
        answer:
          'Logdash has a free Hobby plan that covers monitors, alerts and a public status page. Both products have limits on their free tiers, so read them before you move anything customer-facing.',
      },
      {
        question: 'Is there an open source alternative to Instatus?',
        answer:
          'Logdash is MIT licensed with the source on GitHub. If you want something you can deploy yourself today, Uptime Kuma and Cachet are the usual answers, because Logdash self-hosting is still development-only.',
      },
      {
        question: 'Does Logdash do ping, TCP or DNS checks like Instatus?',
        answer:
          'No. HTTP status and response time, plus push heartbeats for cron and background jobs. If you need to watch a port or a DNS record, Instatus does that and Logdash does not.',
      },
      {
        question: 'Can I keep my status page URL?',
        answer:
          'Yes, if it is on your own domain. Point it at the Logdash page when you are ready. Tell subscribers first, since the subscriber list itself does not transfer.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'atlassian-statuspage',
    h1: 'Atlassian Statuspage alternative for teams who need the checks too',
    answer:
      'Statuspage does no monitoring of its own, so you are paying for the page plus whatever tool feeds it, while Logdash runs the HTTP checks and publishes the page from the same monitors.',
    meta: {
      title: 'Statuspage alternative that monitors | Logdash',
      description:
        'Statuspage does not check anything. You still need a monitor and the glue between them. Logdash runs the check and publishes the page from one monitor.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Statuspage is the default for good reasons. It is the page customers recognise, the component model matches how large systems are actually organised, and the subscriber list scales past numbers most tools ever see.',
      },
      {
        type: 'paragraph',
        text: 'It also checks nothing. Atlassian says so in their own docs: Statuspage does not do any direct monitoring of your websites or servers. Components change colour when a person clicks them, when a third-party integration says so, or when something calls the API. The real stack is a checker, plus Statuspage, plus the glue between them, and the glue is the part that fails quietly. The token expires, the automation stops firing, and the page says everything is fine right through an outage.',
      },
      {
        type: 'paragraph',
        text: 'Logdash removes the middle piece. The HTTP monitor that decides your API is down is the same object the public page renders. There is no integration to keep authorised, because nothing sits between the check and the page. The Telegram or webhook alert goes out at the same moment.',
      },
      {
        type: 'paragraph',
        text: 'What you give up is real and worth listing. Statuspage has email and SMS subscribers, audience-specific pages, component groups, scheduled maintenance windows and first-class links into Jira, Opsgenie and PagerDuty. Logdash has a public page showing your monitors on a custom domain. If your status page has thousands of subscribers and an SLA attached to it, stay where you are.',
      },
      { type: 'heading', text: 'The check behind the component' },
      {
        type: 'code',
        language: 'javascript',
        title: 'health.js',
        code: `import express from 'express';

const app = express();

app.get('/health', async (_req, res) => {
  try {
    await db.query('select 1');
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'down', reason: 'database' });
  }
});

app.listen(3000);`,
      },
      {
        type: 'paragraph',
        text: 'There is a second shape for the things that have no URL. Nightly billing runs, queue workers, sync scripts. Give each one a monitor and have the job POST to https://api.logdash.io/ping/<monitorId> when it finishes. That endpoint is public and takes no body and no auth header, so it is one line at the end of the script. Miss the window and the monitor goes down like any other, which is a class of failure a status page with no checker behind it will never notice.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Point a monitor at the endpoint',
            text: 'One URL, one interval. Status code and response time are recorded from the first check, so you have history before you have a page.',
          },
          {
            title: 'Publish the page',
            text: 'Add the monitor to a public status page and map your status subdomain to it. Nothing to authorise, no API token to rotate every year.',
          },
          {
            title: 'Add the alert',
            text: 'Attach a Telegram channel to the monitor, then take the service down on purpose. The alert reaches your chat while the page is still repainting.',
          },
        ],
      },
      {
        type: 'comparison',
        title: 'Logdash vs Statuspage',
        them: 'Statuspage',
        rows: [
          {
            feature: 'Runs the checks',
            logdash: 'Built in, the monitor drives the page',
            them: 'None, you bring your own checker',
            winner: 'logdash',
          },
          {
            feature: 'Moving parts between check and page',
            logdash: 'None',
            them: 'An integration or an API call you maintain',
            winner: 'logdash',
          },
          {
            feature: 'Open source',
            logdash: 'MIT, source on GitHub',
            them: 'Closed source',
            winner: 'logdash',
          },
          {
            feature: 'Custom domain',
            logdash: 'Point your own domain at it',
            them: 'Point your own domain at it',
            winner: 'tie',
          },
          {
            feature: 'Notifying customers',
            logdash: 'None, alerts go to your team',
            them: 'Email, SMS and Slack subscribers',
            winner: 'them',
          },
          {
            feature: 'Modelling a large system',
            logdash: 'A flat list of monitors',
            them: 'Component groups and audience-specific pages',
            winner: 'them',
          },
          {
            feature: 'Incident workflow',
            logdash: 'Post an update on the page',
            them: 'Templates, maintenance windows, Jira and Opsgenie',
            winner: 'them',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Statuspage',
        reasons: [
          'Your customers subscribe by email or SMS and expect to be told. Logdash has no subscriber notifications at all.',
          'You have components, groups and separate pages for separate audiences. That model does not exist here.',
          'Your incident process runs through Jira, Opsgenie or PagerDuty and the page has to move with it.',
          'Procurement already approved Atlassian. That is a real reason and it outranks most technical ones.',
        ],
      },
      { type: 'heading', text: 'What moving actually looks like' },
      {
        type: 'paragraph',
        text: 'Map each component to one HTTP monitor. If a component turns out to have no check behind it, that is worth knowing on its own, and it is common. Publish the Logdash page on a subdomain and run both for a couple of weeks so you can compare what each one showed during a real incident. Before you move DNS, tell your subscribers, because that list does not come with you and there is no import.',
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there an open source alternative to Statuspage?',
        answer:
          'Logdash is MIT licensed with the source on GitHub, and it runs the checks as well as the page. Cachet is the other common answer if you need something you can deploy yourself today.',
      },
      {
        question: 'Does Statuspage monitor uptime?',
        answer:
          'No. Atlassian states that Statuspage does not do any direct monitoring of your websites or servers. Components are updated by a person, by an integration or through the API.',
      },
      {
        question: 'Can I move my Statuspage subscribers?',
        answer:
          'No. Subscriber lists do not transfer between providers, and Logdash has no subscriber notifications, so give people notice on the old page well before you switch.',
      },
      {
        question: 'What replaces the monitoring tool feeding Statuspage?',
        answer:
          'The Logdash monitor is the checker. You drop the separate uptime tool and the integration, and the page reads from the same monitors that send your Telegram alerts.',
      },
    ],
    updatedAt: '2026-09-04',
  },
];

export const alternatives: SeoFamilyData = {
  family: alternativesFamily,
  pages: alternativesPages,
};
