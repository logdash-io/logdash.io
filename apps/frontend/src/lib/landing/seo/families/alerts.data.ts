import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

/**
 * Family E. The intent is "get the down alert in the app I already watch".
 * Telegram and webhooks are the only native channels, so the Discord, Slack
 * and email pages lead with that and ship the relay that closes the gap.
 *
 * Order matters for the sibling links: every relay page links the webhook
 * page, which documents the payload all three consume.
 */
export const alertsFamily: SeoFamily = {
  key: 'alerts',
  hubPath: '/alerts',
  hubLabel: 'All alert channels',
  title: 'Downtime alerts in the app you already use | Logdash',
  description:
    'Get a message when your site goes down: Telegram built in, and Discord, Slack or email through the Logdash webhook and a 30-line relay.',
  intro:
    'One page per channel, each with the setup, the code and what it cannot do yet.',
};

export const alertsPages: SeoPage[] = [
  {
    slug: 'telegram',
    h1: 'Website down alert on Telegram',
    answer:
      'Add @logdash_uptime_bot to a Telegram chat or group, send it the one-time passphrase Logdash shows you, and the bot posts a red-dot down message on the first failed check and a green-dot up message when the site recovers.',
    meta: {
      title: 'Website down alert on Telegram, no bot token | Logdash',
      description:
        'Add @logdash_uptime_bot to a chat, send one passphrase, and get a message when your site goes down. No BotFather, no chat ID, free on the Hobby plan.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Telegram is the one alert channel Logdash ships end to end, with its own bot. There is no BotFather step, no bot token to store and no chat ID to dig out of a getUpdates response. You add one bot to a chat, send it one line of text, and the chat is connected. It works the same on the free Hobby plan as on Builder and Pro.',
      },
      {
        type: 'heading',
        text: 'How the Telegram uptime monitoring bot connects',
      },
      {
        type: 'list',
        items: [
          "In the monitor's Alerts card, click Add channel and pick Telegram. Logdash shows a one-time passphrase shaped like `/swift_otter_9f2c41d07ab3e655`: two words and 16 hex characters, so 64 random bits.",
          'Open a private chat with `@logdash_uptime_bot`, or add it to a group, and send the passphrase there as a normal message.',
          'Click Message sent. The dashboard asks every 2 seconds whether the passphrase arrived, then shows the chat name. The passphrase works once and expires 60 seconds after the bot receives it, so a leaked screenshot is worth nothing.',
          'Tick the box that assigns the channel to the monitor, then save. The bot posts "Setup was completed successfully" in the chat, so you know delivery works before anything breaks.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Broadcast channels are not supported, only private chats and groups. A group is the usual answer for a co-founder or a small team: everyone in it sees the same alert.',
      },
      {
        type: 'heading',
        text: 'What the Telegram downtime alert says',
      },
      {
        type: 'paragraph',
        text: 'One message when a check flips to down, one when it flips back. Nothing repeats while the site stays down, so a 40-minute outage is two messages, not 40. The down message carries the monitor name, the HTTP status code and the first part of the response body, or the network error when nothing answered: "Connection refused" or "Timed out after 10s".',
      },
      {
        type: 'paragraph',
        text: 'The alert can only be as honest as the endpoint it watches. Logdash marks a check down on any status outside 200-399, on a connection error, or when nothing answers in 10 seconds. A health route that returns 200 while the database is gone never pages anyone, so make it touch the database:',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'server.js',
        code: `import express from 'express';
import { pool } from './db.js';

const app = express();

app.get('/health', async (req, res) => {
  try {
    await pool.query('select 1');
    res.status(200).json({ ok: true });
  } catch {
    // 503 is what turns a dead database into a Telegram message
    res.status(503).json({ ok: false, error: 'db' });
  }
});

app.listen(3000);`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Add the URL',
            text: 'Add a monitor and paste the health URL. Logdash checks it every 5 minutes on Hobby, every minute on Builder ($9/month) and every 15 seconds on Pro ($15/month).',
          },
          {
            title: 'Connect Telegram',
            text: 'Add @logdash_uptime_bot to the chat, send the passphrase, and save the channel to the monitor. The welcome message lands in the chat straight away.',
          },
          {
            title: 'Break it once',
            text: 'Stop the database and leave the app running. The next check gets a 503 and the Telegram alert arrives with the status code and the error body. Start the database again and the green up message follows on the next check.',
          },
        ],
      },
      {
        type: 'heading',
        text: 'Uptime Kuma Telegram vs Logdash',
      },
      {
        type: 'paragraph',
        text: 'Kuma 2.5 has a good Telegram provider with more knobs than Logdash. The cost is the setup: you create your own bot first, and the sender lives on a server you also have to keep alive.',
      },
      {
        type: 'comparison',
        title: 'Telegram alerts: Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Setup',
            logdash: 'Add one bot, send one passphrase',
            them: 'Create a bot in BotFather, paste the token, find the chat ID',
            winner: 'logdash',
          },
          {
            feature: 'Bot identity',
            logdash: 'Shared @logdash_uptime_bot',
            them: 'Your own bot, your name and avatar',
            winner: 'them',
          },
          {
            feature: 'Message options',
            logdash: 'One fixed format',
            them: 'Templates, silent sends, forum topics',
            winner: 'them',
          },
          {
            feature: 'Alert after',
            logdash: 'The first failed check',
            them: 'A configurable number of retries',
            winner: 'them',
          },
          {
            feature: 'Where the sender runs',
            logdash: 'Hosted, outside your stack',
            them: 'Your server, and it goes down with it',
            winner: 'logdash',
          },
          {
            feature: 'Price',
            logdash: 'Free on Hobby',
            them: 'Free, plus the server',
            winner: 'tie',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You already run Kuma on a box you trust. With a BotFather token in hand its Telegram setup takes five minutes.',
          'You want alerts from your own bot under your own name, sent silently or into a forum topic.',
          'You only want to hear about it after three failed checks in a row. Logdash alerts on the first one.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a Telegram uptime monitoring bot?',
        answer:
          'Yes. @logdash_uptime_bot posts down and up alerts for your Logdash monitors into any private chat or group you connect with a passphrase. It is free on the Hobby plan, which checks 5 monitors every 5 minutes.',
      },
      {
        question: 'Do I need to create my own website monitoring Telegram bot?',
        answer:
          'Not with Logdash. The shared bot sends the alerts, so there is no BotFather token or chat ID to manage. Tools like Uptime Kuma do ask you to create your own bot, which also means the bot name and avatar are yours.',
      },
      {
        question: 'When does a Telegram downtime alert fire?',
        answer:
          'On the first check that sees a status outside 200-399, a connection error or no answer within 10 seconds. You get one message per state change: one when it goes down, one when it comes back.',
      },
      {
        question: 'How do I set up Uptime Kuma Telegram notifications?',
        answer:
          'Create a bot with /newbot in BotFather, paste its token into a Telegram notification in Kuma, send the bot a message, and let Kuma fetch the chat ID from getUpdates. Then send a test. It works well, it just runs on your server.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'discord',
    h1: 'Discord uptime monitoring bot',
    answer:
      'Logdash has no Discord bot, so the working setup is a Discord channel webhook fed by a 30-line Cloudflare Worker that turns the Logdash webhook alert into a Discord message.',
    meta: {
      title: 'Discord uptime monitoring bot, via webhook | Logdash',
      description:
        'No Discord bot to invite: a 30-line Cloudflare Worker turns the Logdash webhook into a Discord message. The real payload, the relay code, and when Kuma wins.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Straight answer first. Logdash ships two alert channels, Telegram and webhook. There is no Discord integration and no bot to invite. What does exist: a webhook channel that sends a small JSON object every time a monitor changes state, and Discord channels that accept messages through a webhook URL. Put a 30-line relay between the two and you have a Discord website down alert.',
      },
      {
        type: 'paragraph',
        text: 'Why not paste the Discord URL straight into Logdash? Discord wants a `content` or `embeds` field. Logdash sends `newStatus`, `name`, `url`, `statusCode` and `errorMessage`, so Discord rejects the request as an empty message. The relay reshapes one into the other.',
      },
      {
        type: 'paragraph',
        text: 'One plan detail before you start. On the free Hobby plan the webhook channel sends a bare GET with no body and no headers, which tells a relay that something happened but not what. POST with the JSON body and custom headers come with Builder at $9 a month. On Hobby, Telegram is the free channel that carries the whole alert.',
      },
      {
        type: 'heading',
        text: 'The Discord webhook uptime monitor relay',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'worker.js',
        code: `// worker.js - Logdash webhook in, Discord message out.
// npx wrangler deploy worker.js --name logdash-discord \\
//   --compatibility-date 2026-01-01
// npx wrangler secret put DISCORD_WEBHOOK_URL --name logdash-discord
// npx wrangler secret put RELAY_SECRET --name logdash-discord
export default {
  async fetch(request, env) {
    const secret = request.headers.get('x-relay-secret');

    if (request.method !== 'POST' || secret !== env.RELAY_SECRET) {
      return new Response('forbidden', { status: 403 });
    }

    // { httpMonitorId, newStatus, name, url, statusCode, errorMessage? }
    const alert = await request.json();
    const down = alert.newStatus === 'down';
    const icon = down ? '🔴' : '🟢';
    const lines = [
      \`\${icon} **\${alert.name}** is \${alert.newStatus}\`,
      \`\\\`\${alert.url}\\\`\`,
    ];

    if (down) {
      lines.push(
        \`Status code: \${alert.statusCode}\`,
        \`Error: \${alert.errorMessage ?? 'N/A'}\`,
      );
    }

    const sent = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'Logdash',
        content: lines.join('\\n').slice(0, 2000),
        allowed_mentions: { parse: [] },
      }),
    });

    return new Response(null, { status: sent.ok ? 204 : 502 });
  },
};`,
      },
      {
        type: 'paragraph',
        text: 'Three lines in there do the real work. The secret header check matters because a workers.dev URL is public, and without it anyone who finds the URL can post into your channel. `allowed_mentions` with an empty parse list stops an error page that happens to contain @everyone from pinging the whole server. The 2,000 character slice is the Discord limit for `content`, and the error body Logdash forwards can be up to 1,000 characters on its own.',
      },
      {
        type: 'paragraph',
        text: 'One risk is specific to Cloudflare. Workers send from shared IP addresses, and Discord has rate-limited busy Cloudflare ranges before, answering 429 or error 1015. The relay then returns 502, and Logdash does not retry. If `npx wrangler tail logdash-discord` ever shows that, run the same handler on a host with its own IP.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create the Discord webhook',
            text: 'Server Settings, Integrations, Webhooks, New Webhook. Pick the channel and click Copy Webhook URL. You need the Manage Webhooks permission on that channel.',
          },
          {
            title: 'Deploy the relay',
            text: 'Run the three wrangler commands at the top of the file and paste the Discord URL and a long random secret when asked. The Cloudflare free plan allows 100,000 requests a day, and an alert channel uses a handful.',
          },
          {
            title: 'Wire it and break it',
            text: 'In Logdash add a webhook channel with method POST, the workers.dev URL and an x-relay-secret header holding the same secret, then attach it to the monitor next to your Telegram channel. Stop the app: the next failed check posts the red message in Discord and the Telegram alert lands on your phone.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: 'What lands in the channel: a red circle, the monitor name in bold, the URL in a code span so Discord does not unfurl a preview of your own broken site, then the status code and the error. Recovery is a green circle, the name and the URL.',
      },
      {
        type: 'heading',
        text: 'Uptime Kuma Discord vs Logdash',
      },
      {
        type: 'paragraph',
        text: 'Kuma has Discord built in, with a choice of normal, minimalist or fully templated messages. If Discord is the only channel you care about, that is the shorter path.',
      },
      {
        type: 'comparison',
        title: 'Discord alerts: Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Discord support',
            logdash: 'Webhook channel plus a 30-line relay',
            them: 'Built in, paste the webhook URL',
            winner: 'them',
          },
          {
            feature: 'Plan needed',
            logdash: 'Builder, $9/month, for POST',
            them: 'Free, plus the server',
            winner: 'them',
          },
          {
            feature: 'Message format',
            logdash: 'Whatever your relay writes',
            them: 'Normal, minimalist or a custom template',
            winner: 'tie',
          },
          {
            feature: 'Alert after',
            logdash: 'The first failed check',
            them: 'A configurable number of retries',
            winner: 'them',
          },
          {
            feature: 'Where the sender runs',
            logdash: 'Hosted, outside your stack',
            them: 'Your server, and it goes down with it',
            winner: 'logdash',
          },
          {
            feature: 'App logs and metrics',
            logdash: 'Same dashboard, eight SDKs',
            them: 'Not what Kuma is for',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You already run Kuma. Discord is a dropdown there, no code and no extra account.',
          'You want Discord alerts for $0. Kuma does it on your own box, while the Logdash webhook only carries the alert from Builder up.',
          'Nobody on the team wants to own code in the alert path, even 30 lines of it.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Is there a Discord uptime monitoring bot for Logdash?',
        answer:
          'No. Logdash posts to Discord through a channel webhook and a small relay, not a bot account. For most uptime tools that is the same thing under the hood: Uptime Kuma also posts to Discord with a webhook URL.',
      },
      {
        question: 'How do I get a Discord website down alert for free?',
        answer:
          'Not with Logdash, whose free webhook sends a GET without the alert body. UptimeRobot posts to Discord on its free plan, and a self-hosted Uptime Kuma does too. On the Logdash Hobby plan the free alert channel is Telegram.',
      },
      {
        question: 'Can a Discord webhook uptime monitor skip the relay?',
        answer:
          'Not with Logdash. Discord needs a content or embeds field and Logdash sends its own six-field JSON, so a direct request is rejected. Tools that template the request body, like Uptime Kuma, can post to Discord without one.',
      },
      {
        question: 'How do I set up Uptime Kuma Discord alerts?',
        answer:
          'Add a notification in Kuma, pick Discord as the type, and paste the channel webhook URL from Server Settings, Integrations, Webhooks. Send a test, then enable it on each monitor.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'slack',
    h1: 'Slack uptime monitoring',
    answer:
      'Logdash has no native Slack app, so Slack uptime monitoring means a Logdash webhook channel posting to a 30-line Cloudflare Worker that forwards every down and up alert to a Slack incoming webhook.',
    meta: {
      title: 'Slack uptime monitoring with a webhook relay | Logdash',
      description:
        'Get a Slack message when your site goes down: the Logdash webhook, a 30-line Cloudflare Worker and a Slack incoming webhook. Plus when UptimeRobot is simpler.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'If your team lives in Slack, the website down alert should land there. Logdash does not ship a Slack app. It ships a webhook channel, and Slack ships incoming webhooks, and the two do not speak the same JSON. Slack wants a `text` field, Logdash sends `newStatus`, `name`, `url`, `statusCode` and `errorMessage`. A Cloudflare Worker in the middle translates.',
      },
      {
        type: 'paragraph',
        text: 'The relay needs the Builder plan at $9 a month. On the free Hobby plan the webhook channel can only send a GET with no body and no headers, so the relay would learn that something changed but not which monitor or which way. Builder adds POST with the JSON body, custom headers and one-minute checks.',
      },
      {
        type: 'heading',
        text: 'The Slack downtime notification relay',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'worker.js',
        code: `// worker.js - Logdash webhook in, Slack message out.
// npx wrangler deploy worker.js --name logdash-slack \\
//   --compatibility-date 2026-01-01
// npx wrangler secret put SLACK_WEBHOOK_URL --name logdash-slack
// npx wrangler secret put RELAY_SECRET --name logdash-slack
const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export default {
  async fetch(request, env) {
    const secret = request.headers.get('x-relay-secret');

    if (request.method !== 'POST' || secret !== env.RELAY_SECRET) {
      return new Response('forbidden', { status: 403 });
    }

    // { httpMonitorId, newStatus, name, url, statusCode, errorMessage? }
    const alert = await request.json();
    const down = alert.newStatus === 'down';
    const icon = down ? ':red_circle:' : ':large_green_circle:';
    let text = \`\${icon} *\${esc(alert.name)}* is \${alert.newStatus}\`;
    text += \`\\n\${esc(alert.url)}\`;

    if (down) {
      text += \`\\nStatus code: \${alert.statusCode}\`;
      text += \`\\nError: \${esc(alert.errorMessage ?? 'N/A')}\`;
    }

    const sent = await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    return new Response(null, { status: sent.ok ? 204 : 502 });
  },
};`,
      },
      {
        type: 'paragraph',
        text: 'The `esc` helper is not decoration. Slack treats `<`, `>` and `&` as control characters in message text, and the error Logdash forwards is the first 1,000 characters of whatever your server answered. When nginx returns its HTML 502 page, unescaped tags would mangle the message. Slack answers a good post with 200 and the body ok, which the relay passes back as 204.',
      },
      {
        type: 'paragraph',
        text: 'Two Slack rules to know. The channel is fixed when you install the app, and the payload cannot override it, so a second channel means a second webhook URL. And a Slack website down alert is only as early as your check interval: 5 minutes on Hobby, 1 minute on Builder, 15 seconds on Pro.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Create the Slack incoming webhook',
            text: 'Create a Slack app for your workspace, open Incoming Webhooks, switch on Activate Incoming Webhooks, click Add New Webhook to Workspace and pick the channel. Copy the hooks.slack.com URL.',
          },
          {
            title: 'Deploy the relay',
            text: 'Run the three wrangler commands from the top of the file, pasting the Slack URL and a long random secret. The Cloudflare free plan allows 100,000 requests a day.',
          },
          {
            title: 'Wire it and break it',
            text: 'Add a Logdash webhook channel: method POST, the workers.dev URL, header x-relay-secret with the same secret. Attach it to the monitor next to Telegram, stop the app, and the next failed check posts in Slack while the Telegram alert reaches your phone.',
          },
        ],
      },
      {
        type: 'heading',
        text: 'What the Slack website down alert looks like',
      },
      {
        type: 'paragraph',
        text: 'A red circle, the monitor name in bold, the URL, the status code and the error on separate lines. Recovery is a green circle with the name and URL. Add Block Kit sections in the relay if you want buttons or a link to the runbook; it is your code.',
      },
      {
        type: 'paragraph',
        text: 'Keep Telegram on the same monitor anyway. Logdash makes one delivery attempt per alert and does not retry, so the hour your Worker or Slack has a problem is an hour of silent alerts. A second channel that runs no code of yours costs nothing.',
      },
      {
        type: 'heading',
        text: 'Uptime monitoring Slack integration: Logdash vs UptimeRobot',
      },
      {
        type: 'comparison',
        title: 'Slack alerts: Logdash vs UptimeRobot',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Slack support',
            logdash: 'Webhook channel plus a 30-line relay',
            them: 'Built in',
            winner: 'them',
          },
          {
            feature: 'Cheapest plan with Slack',
            logdash: 'Builder, $9/month',
            them: 'Solo, its cheapest paid plan',
            winner: 'tie',
          },
          {
            feature: 'Check interval on that plan',
            logdash: '1 minute',
            them: '60 seconds',
            winner: 'tie',
          },
          {
            feature: 'Alert after a delay, repeat while down',
            logdash: 'No, one message per state change',
            them: 'Threshold and recurrence from Solo',
            winner: 'them',
          },
          {
            feature: 'Telegram alerts',
            logdash: 'Free on Hobby',
            them: 'From Solo',
            winner: 'logdash',
          },
          {
            feature: 'App logs and metrics',
            logdash: 'Same dashboard, eight SDKs',
            them: 'Not offered',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'Slack is the only channel that matters to your team and nobody wants to own a Worker. UptimeRobot Solo posts there with no code.',
          'You want to hear only after the site has been down for a few minutes, and get reminded every few minutes until it is back.',
          'You also need Microsoft Teams or Mattermost from the same tool. Logdash would need one relay per destination.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Logdash have an uptime monitoring Slack integration?',
        answer:
          'Not a native one. Native channels are Telegram and webhook. The webhook plus the Worker on this page gets alerts into Slack, and it needs the Builder plan because the free plan webhook cannot send a body.',
      },
      {
        question: 'How do I get a Slack website down alert?',
        answer:
          'Create a Slack incoming webhook, deploy the relay Worker with that URL as a secret, and add a POST webhook channel in Logdash pointing at the Worker. The first failed check after that posts in the channel.',
      },
      {
        question:
          'What does a Slack downtime notification from Logdash look like?',
        answer:
          'Whatever the relay writes. The one above posts a red circle, the monitor name in bold, the URL, the status code and the error body, and a green circle with the name when it recovers.',
      },
      {
        question: 'Is Slack uptime monitoring free?',
        answer:
          'Rarely. Logdash needs Builder at $9 a month for the POST webhook, and UptimeRobot puts Slack on Solo, its cheapest paid plan, not on Free. A self-hosted Uptime Kuma posts to Slack for the cost of the server.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'email',
    h1: 'Website down notification email',
    answer:
      'Logdash does not send email alerts itself, so a website down notification email means a Logdash webhook pointed at a 30-line Cloudflare Worker that mails each down and up alert through Resend or Postmark.',
    meta: {
      title: 'Website down notification email via Resend | Logdash',
      description:
        'Logdash has no native email alerts. Here is the 30-line relay that turns its webhook into an email through Resend or Postmark, and when UptimeRobot is simpler.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'Honest version first: Logdash sends alerts to Telegram and to webhooks, and email is not one of them. If you want a website down email alert with zero code, UptimeRobot sends one on its free plan and is the better pick for that job. If you are already on Logdash, or want the email next to a Telegram ping, a small relay does it.',
      },
      {
        type: 'paragraph',
        text: 'The relay needs Builder at $9 a month. The free Hobby webhook sends a GET with no body, so there is nothing to put in the email. Builder sends a POST with the monitor name, the new status, the URL, the status code and the error.',
      },
      {
        type: 'heading',
        text: 'The website down email alert relay',
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'worker.js',
        code: `// worker.js - Logdash webhook in, email out through Resend.
// npx wrangler deploy worker.js --name logdash-email \\
//   --compatibility-date 2026-01-01
// npx wrangler secret put RESEND_API_KEY --name logdash-email
// npx wrangler secret put RELAY_SECRET --name logdash-email
// npx wrangler secret put ALERT_TO --name logdash-email
// ALERT_TO takes one address or a comma separated list.
export default {
  async fetch(request, env) {
    const secret = request.headers.get('x-relay-secret');

    if (request.method !== 'POST' || secret !== env.RELAY_SECRET) {
      return new Response('forbidden', { status: 403 });
    }

    // { httpMonitorId, newStatus, name, url, statusCode, errorMessage? }
    const alert = await request.json();
    const lines = [
      \`\${alert.name} is \${alert.newStatus}\`,
      \`URL: \${alert.url}\`,
      \`Status code: \${alert.statusCode}\`,
    ];

    if (alert.errorMessage) {
      lines.push(\`Error: \${alert.errorMessage}\`);
    }

    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: \`Bearer \${env.RESEND_API_KEY}\`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Logdash alerts <onboarding@resend.dev>',
        to: env.ALERT_TO.split(',').map((address) => address.trim()),
        subject: \`\${alert.newStatus.toUpperCase()}: \${alert.name}\`,
        text: lines.join('\\n'),
      }),
    });

    return new Response(null, { status: sent.ok ? 204 : 502 });
  },
};`,
      },
      {
        type: 'paragraph',
        text: 'The `from` address `onboarding@resend.dev` works without a domain, but Resend only delivers it to the address on your own Resend account. For a solo founder that is enough. To mail anyone else, verify a sending domain in Resend and change `from` to an address on it. The Resend free plan covers 3,000 emails a month and 100 a day. An alert channel sends two per incident.',
      },
      {
        type: 'paragraph',
        text: 'Prefer Postmark? Swap the URL for `https://api.postmarkapp.com/email`, send the key in an `X-Postmark-Server-Token` header instead of authorization, and add `Accept: application/json`, and rename the fields to `From`, `To`, `Subject` and `TextBody`. Postmark wants `To` as one comma separated string, and `From` must be a confirmed sender signature. Its free developer plan covers 100 emails a month, and until Postmark approves the account it only delivers to your own domain.',
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Get a Resend API key',
            text: 'Create a Resend account and an API key with sending access. Note the email address on the account, since that is where the test domain can deliver.',
          },
          {
            title: 'Deploy the relay',
            text: 'Run the four wrangler commands at the top of the file and paste the API key, a long random secret and your address when asked. The Cloudflare free plan allows 100,000 requests a day.',
          },
          {
            title: 'Wire it and break it',
            text: 'Add a Logdash webhook channel with method POST, the workers.dev URL and an x-relay-secret header holding the same secret, attached to the monitor next to Telegram. Stop the app: the email goes out and the Telegram alert reaches your phone on the same check.',
          },
        ],
      },
      {
        type: 'heading',
        text: 'What the email says',
      },
      {
        type: 'paragraph',
        text: 'Subject `DOWN: API` or `UP: API`, then plain text: the name and new status, the URL, the status code and, on down, the error, which is either the first part of the response body or a network error such as `Timed out after 10s`. Plain text on purpose, because it reads the same in every mail client.',
      },
      {
        type: 'paragraph',
        text: 'An inbox is where alerts go to be read later. A 3am outage email waits next to the newsletters until you next open mail, so it is the record, not the wake-up call. Keep Telegram attached to the same monitor for the ping that reaches you, and let the email be the thread you forward to a client or a co-founder.',
      },
      {
        type: 'heading',
        text: 'Uptime monitoring email alerts: Logdash vs UptimeRobot',
      },
      {
        type: 'comparison',
        title: 'Email alerts: Logdash vs UptimeRobot',
        them: 'UptimeRobot',
        rows: [
          {
            feature: 'Email alerts',
            logdash: 'Webhook plus a relay you deploy',
            them: 'Built in on every plan',
            winner: 'them',
          },
          {
            feature: 'Cheapest plan with email',
            logdash: 'Builder, $9/month, plus a free Resend account',
            them: 'Free',
            winner: 'them',
          },
          {
            feature: 'Free plan check interval',
            logdash: '5 minutes',
            them: '5 minutes',
            winner: 'tie',
          },
          {
            feature: 'Telegram alerts',
            logdash: 'Free on Hobby',
            them: 'From Solo, its cheapest paid plan',
            winner: 'logdash',
          },
          {
            feature: 'App logs and metrics',
            logdash: 'Same dashboard, eight SDKs',
            them: 'Not offered',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'UptimeRobot',
        reasons: [
          'Email is the channel you want and you do not want to deploy anything. UptimeRobot sends it on the free plan.',
          'You want the email only after the site has been down for a few minutes, with reminders until it is back. UptimeRobot has both from Solo, Logdash sends one alert per state change.',
          'You never want to own code in the alert path. A relay is one more thing that can break quietly.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'Does Logdash send a website down notification email?',
        answer:
          'Not natively. Alerts go to Telegram or a webhook. The webhook plus the relay on this page sends the email through Resend or Postmark, and needs the Builder plan because the free webhook has no body.',
      },
      {
        question: 'How do I set up a website down email alert?',
        answer:
          'Deploy the Worker above with a Resend API key, a shared secret and your address, then add a POST webhook channel in Logdash with the same secret in an x-relay-secret header. The next failed check sends the email.',
      },
      {
        question: 'Which uptime monitoring email alerts are free?',
        answer:
          'UptimeRobot sends email alerts on its free plan, 5-minute checks included. Logdash does not, but its free Hobby plan sends Telegram alerts for 5 monitors at the same 5-minute interval.',
      },
      {
        question: 'How fast does a website down email alert arrive?',
        answer:
          'The webhook leaves Logdash on the check that flips the monitor, so the delay is your interval: up to 5 minutes on Hobby, 1 on Builder, 15 seconds on Pro. After that it is down to Resend and your inbox.',
      },
    ],
    updatedAt: '2026-10-02',
  },
  {
    slug: 'webhook',
    h1: 'Uptime monitoring webhook',
    answer:
      'When a check flips between up and down, Logdash sends one HTTP request to your URL, and on POST, PUT or PATCH it carries a flat JSON body with the monitor id, new status, name, URL, status code and error.',
    meta: {
      title: 'Uptime monitoring webhook: payload and rules | Logdash',
      description:
        'The exact JSON Logdash sends when a monitor goes down or comes back, which methods carry a body, the 30-second deadline, and a receiver you can paste.',
    },
    blocks: [
      {
        type: 'paragraph',
        text: 'A downtime webhook is the escape hatch for everything Logdash does not ship natively: Slack, Discord, email, PagerDuty, a status light on your desk. Logdash sends a request on every state change, nothing more. The first failed check flips the monitor to down and fires one request. The first good check after that fires one more with the new status set to up. A three-hour outage is two requests. Every channel on the monitor fires on the same state change, so the webhook and a Telegram chat hear about it at the same moment.',
      },
      {
        type: 'heading',
        text: 'The uptime webhook payload',
      },
      {
        type: 'code',
        language: 'json',
        title: 'down',
        code: `{
  "httpMonitorId": "6650f3c2a1b2c3d4e5f60718",
  "newStatus": "down",
  "name": "API",
  "url": "https://api.example.com/health",
  "errorMessage": "{\\"ok\\":false,\\"error\\":\\"db\\"}",
  "statusCode": "503"
}`,
      },
      {
        type: 'code',
        language: 'json',
        title: 'up',
        code: `{
  "httpMonitorId": "6650f3c2a1b2c3d4e5f60718",
  "newStatus": "up",
  "name": "API",
  "url": "https://api.example.com/health",
  "statusCode": "200"
}`,
      },
      {
        type: 'list',
        items: [
          '`newStatus` is `down` or `up`. Down means a status outside 200-399, a connection error, or no answer within 10 seconds.',
          '`statusCode` is a string. It is `"0"` when nothing answered at all.',
          '`errorMessage` is the first 1,000 characters of the response body on a bad status, or the network error, such as `Connection refused` or `Timed out after 10s`. On up it is left out of the body entirely.',
          '`url` is the address being checked. For a heartbeat monitor it is the literal string `push monitor`, and a missed beat arrives as status `"0"` with a `Did not receive call for this time range` error.',
        ],
      },
      {
        type: 'heading',
        text: 'Website down webhook delivery rules',
      },
      {
        type: 'list',
        items: [
          'On the free Hobby plan the method is GET, with no body, no query string and no custom headers. Your endpoint learns that some monitor on that channel changed, not which way.',
          'Builder ($9/month) and Pro ($15/month) add POST, PUT, PATCH and DELETE plus custom headers. POST, PUT and PATCH carry the JSON as `application/json`. GET and DELETE never carry a body.',
          'Requests are not signed. Add a header with a long random secret and reject anything without it.',
          'One attempt, a 30-second deadline, and any answer outside 2xx counts as a failure that is logged and not retried. Answer first, do the slow work after.',
          'Up to 5 redirects are followed, but a 301 or 302 turns a POST into a GET without the body, so paste the final https URL. Private and internal addresses are refused, so localhost and 10.x URLs do not work.',
          'Saving the channel sends nothing. Unlike Telegram there is no welcome message, so test the receiver with curl first.',
        ],
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'receiver.mjs',
        code: `// receiver.mjs - LOGDASH_SECRET=change-me node receiver.mjs
import { createServer } from 'node:http';

createServer(async (req, res) => {
  const secret = req.headers['x-logdash-secret'];

  if (req.method !== 'POST' || secret !== process.env.LOGDASH_SECRET) {
    res.writeHead(403).end();
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let alert;
  try {
    alert = JSON.parse(body);
  } catch {
    res.writeHead(400).end();
    return;
  }

  // Answer first: Logdash waits 30 seconds at most and never retries.
  res.writeHead(204).end();

  const { name, newStatus, statusCode, errorMessage = '' } = alert;
  console.log(\`\${name} is \${newStatus} (\${statusCode}) \${errorMessage}\`);
}).listen(8080);`,
      },
      {
        type: 'steps',
        items: [
          {
            title: 'Expose the receiver',
            text: 'Run it behind any public HTTPS URL and simulate a down alert first: post the JSON above to it with curl and the x-logdash-secret header, and check the log line appears.',
          },
          {
            title: 'Add the webhook channel',
            text: "In the monitor's Alerts card, Add channel, then Webhook: method POST, your URL, header x-logdash-secret. Tick the box to attach it to the monitor, and keep a Telegram channel attached as well.",
          },
          {
            title: 'Break it',
            text: 'Stop the app behind the monitor. On the next check your receiver logs the down payload, and the Telegram alert arrives at the same moment from the same state change.',
          },
        ],
      },
      {
        type: 'heading',
        text: 'Logdash vs Uptime Kuma webhooks',
      },
      {
        type: 'comparison',
        title: 'Downtime webhooks: Logdash vs Uptime Kuma',
        them: 'Uptime Kuma',
        rows: [
          {
            feature: 'Default body',
            logdash: 'Flat JSON, six fields',
            them: 'Nested heartbeat and monitor objects plus a message',
            winner: 'logdash',
          },
          {
            feature: 'Custom body template',
            logdash: 'No, reshape it in a relay',
            them: 'Yes, with template variables',
            winner: 'them',
          },
          {
            feature: 'Body and headers at $0',
            logdash: 'Bare GET on Hobby',
            them: 'Yes, on your own server',
            winner: 'them',
          },
          {
            feature: 'Request signing',
            logdash: 'None, use a secret header',
            them: 'None, use a secret header',
            winner: 'tie',
          },
          {
            feature: 'Where the sender runs',
            logdash: 'Hosted, outside your stack',
            them: 'Your server, and it goes down with it',
            winner: 'logdash',
          },
        ],
      },
      {
        type: 'pick-them',
        them: 'Uptime Kuma',
        reasons: [
          'You want to template the body and post straight to Slack, Discord or Teams with no relay in between.',
          'You need a webhook with a body at $0 and already have a server to run Kuma on.',
          'You want the alert only after several failed checks in a row. Kuma has retries, Logdash fires on the first.',
        ],
      },
    ],
    featurePath: '/features/monitoring',
    faq: [
      {
        question: 'What is in the uptime webhook payload?',
        answer:
          'httpMonitorId, newStatus, name, url, statusCode and, on down, errorMessage. statusCode is a string, "0" when nothing answered. The body is only sent on POST, PUT and PATCH, which need the Builder or Pro plan.',
      },
      {
        question: 'When does the downtime webhook fire?',
        answer:
          'On every state change: the first failed check sends one down request, the first good check after it sends one up request. Nothing repeats while the status stays the same.',
      },
      {
        question: 'Does a website down webhook retry if my endpoint fails?',
        answer:
          'No. Logdash makes one attempt with a 30-second deadline. A timeout or a non-2xx answer is logged on our side and dropped, so answer fast and queue any slow work.',
      },
      {
        question: 'Which plan includes the uptime monitoring webhook?',
        answer:
          'All of them, with a catch. Hobby sends a GET without body or headers. Builder at $9 a month and Pro at $15 add POST, PUT and PATCH with the JSON body, plus custom headers. For comparison, UptimeRobot puts webhooks on Team, the plan above Solo.',
      },
    ],
    updatedAt: '2026-10-02',
  },
];

export const alerts: SeoFamilyData = {
  family: alertsFamily,
  pages: alertsPages,
};
