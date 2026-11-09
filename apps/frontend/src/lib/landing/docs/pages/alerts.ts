import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/alerts',
  title: 'Alerts',
  metaTitle: 'Alerts | Logdash Docs',
  description:
    'Get an email, a Telegram message or a webhook call when a monitor goes down and again when it is back up.',
  keywords:
    'downtime alerts, uptime alerts, telegram alerts, webhook alerts, monitor notifications',
  blocks: [
    {
      type: 'paragraph',
      text: 'When a monitor goes down, Logdash alerts the channels of its domain. When it comes back up, the same channels get a recovery alert. A channel is an email address, a Telegram chat or a webhook URL.',
    },
    { type: 'heading', text: 'When alerts are sent' },
    {
      type: 'list',
      items: [
        '**Down** after 2 failed checks in a row. One failed check alone sends nothing, so a single slow answer does not wake you.',
        '**Up** on the first healthy check after a down alert.',
        'A new monitor sends an up alert after its first healthy check, so you know its alerts reach you.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Alerts cover [uptime monitors](/docs/monitoring) and [heartbeat monitors](/docs/monitoring/heartbeats). Logs and metrics do not send alerts.',
    },
    { type: 'heading', text: 'Channels' },
    {
      type: 'paragraph',
      text: 'Channels belong to a domain. Open your domain, go to **Settings** and find the **Alerts** card. Every monitor of the domain alerts every channel there, and a new channel starts alerting all monitors at once. A domain can have up to 100 channels.',
    },
    {
      type: 'paragraph',
      text: 'To stop one monitor from alerting a channel, open the monitor and uncheck the channel in its **Alerts** card. The other monitors keep alerting it.',
    },
    {
      type: 'callout',
      text: 'You get email alerts without any setup. When you add a monitor to a domain that has no channels yet, Logdash adds an email channel for the address you signed in with.',
    },
    { type: 'heading', text: 'Email' },
    {
      type: 'paragraph',
      text: 'Email alerts come from **Logdash Alerts**. The subject says what changed, such as `🔴 api.example.com is down` or `🟢 api.example.com is up`. A down email shows the status code and the error, and the **Open dashboard** button opens the monitor.',
    },
    {
      type: 'paragraph',
      text: 'Email channels can only go to members of the domain. Delete the channel in the **Alerts** card to stop the emails.',
    },
    { type: 'heading', text: 'Telegram' },
    {
      type: 'paragraph',
      text: 'Logdash sends Telegram alerts through its bot, `@logdash_uptime_bot`, to a private chat or to a group.',
    },
    {
      type: 'steps',
      items: [
        {
          title: 'Choose Telegram',
          text: 'In the **Alerts** card, press **Add channel** and choose **Telegram**.',
        },
        {
          title: 'Send the passphrase',
          text: 'Logdash shows the bot and a passphrase. Add the bot to the chat or group, then send the passphrase there as a message. The passphrase works once, for 60 seconds.',
        },
        {
          title: 'Save the channel',
          text: 'Press **Message sent**. Logdash checks for your message every few seconds. When it shows **Telegram chat found**, press **Save channel**.',
        },
      ],
    },
    {
      type: 'code',
      language: 'text',
      title: 'A down alert in Telegram',
      code: `🔴  api.example.com is down
Status code: 503
Error: Service Unavailable`,
    },
    { type: 'heading', text: 'Webhooks' },
    {
      type: 'paragraph',
      text: 'A webhook calls a URL of yours on every alert, so you can post to a chat tool, open an incident or restart a service.',
    },
    {
      type: 'steps',
      items: [
        {
          title: 'Choose Webhook',
          text: 'In the **Alerts** card, press **Add channel** and choose **Webhook**.',
        },
        {
          title: 'Enter the URL',
          text: 'Give the webhook a name, enter the URL and pick the HTTP method: `GET`, `POST`, `PUT`, `PATCH` or `DELETE`. Press **Continue**.',
        },
        {
          title: 'Add headers',
          text: 'Optionally, add headers that Logdash sends with every request, such as a secret your endpoint checks. Press **Save channel**.',
        },
      ],
    },
    {
      type: 'paragraph',
      text: 'With `POST`, `PUT` and `PATCH`, Logdash sends this JSON body. `GET` and `DELETE` requests have no body.',
    },
    {
      type: 'code',
      language: 'json',
      title: 'Request body',
      code: `{
  "httpMonitorId": "6650f1c2a3b4c5d6e7f80912",
  "newStatus": "down",
  "name": "api.example.com",
  "url": "https://api.example.com/health",
  "errorMessage": "Timed out after 10s",
  "statusCode": "0"
}`,
    },
    {
      type: 'table',
      headers: ['Field', 'Description'],
      rows: [
        ['`httpMonitorId`', 'The ID of the monitor.'],
        ['`newStatus`', '`down` or `up`.'],
        ['`name`', 'The name of the monitor.'],
        [
          '`url`',
          'The URL the monitor checks. For heartbeat monitors it is `push monitor`.',
        ],
        ['`errorMessage`', 'Why the last check failed.'],
        [
          '`statusCode`',
          'The status code of the last check, as a string. `"0"` means there was no answer.',
        ],
      ],
    },
    {
      type: 'list',
      items: [
        'Logdash sends each alert once, without retries, and waits up to 30 seconds for an answer.',
        'Requests are not signed. To check that a request comes from Logdash, add a secret header and compare it in your endpoint.',
        'The URL has to resolve to a public IP address.',
      ],
    },
    {
      type: 'callout',
      tone: 'warning',
      text: 'On the Hobby plan, webhooks use `GET` with no headers, so the request carries no body. Upgrade to Builder to use the other methods, headers and the JSON body.',
    },
  ],
};
