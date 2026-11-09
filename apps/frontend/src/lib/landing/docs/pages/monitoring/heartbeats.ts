import CurlIcon from '$lib/domains/shared/icons/CurlIcon.svelte';
import NodeJSIcon from '$lib/domains/shared/icons/NodeJSIcon.svelte';
import PythonIcon from '$lib/domains/shared/icons/PythonIcon.svelte';
import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/monitoring/heartbeats',
  title: 'Heartbeat monitors',
  metaTitle: 'Heartbeat monitors | Logdash Docs',
  description:
    'Watch workers and background processes that have no URL: your process calls Logdash, and Logdash alerts you when the calls stop.',
  keywords:
    'heartbeat monitoring, push monitor, worker monitoring, background job monitoring, dead man switch',
  blocks: [
    {
      type: 'paragraph',
      text: 'A heartbeat monitor turns an [uptime monitor](/docs/monitoring) around. Logdash does not call you: your process calls a URL of the monitor, and the monitor goes down when the calls stop. Use it for processes that run all the time but have no URL to check, such as queue consumers, pollers and sync loops.',
    },
    {
      type: 'callout',
      text: 'Heartbeat monitors are on the Pro plan.',
    },
    { type: 'heading', text: 'Create a heartbeat monitor' },
    {
      type: 'steps',
      items: [
        {
          title: 'Choose heartbeats',
          text: 'Open your domain, go to **Uptime**, press **Add monitor** and choose **You send heartbeats**.',
        },
        {
          title: 'Copy the endpoint',
          text: 'Logdash shows the **Heartbeat endpoint** of the new monitor. Copy it with the copy button next to it. It looks like `https://api.logdash.io/ping/<monitor-id>`.',
        },
        {
          title: 'Name it and save',
          text: 'Give the monitor a name and press **Start monitoring**. A monitor you do not save is deleted after 10 minutes.',
        },
      ],
    },
    { type: 'heading', text: 'Send heartbeats' },
    {
      type: 'paragraph',
      text: 'Send a `POST` to the endpoint after each pass of real work. The request needs no key, headers or body.',
    },
    {
      type: 'code-group',
      items: [
        {
          title: 'curl',
          icon: CurlIcon,
          language: 'bash',
          code: `PING_URL="https://api.logdash.io/ping/$LOGDASH_MONITOR_ID"

while true; do
  ./process-queue
  curl -fsS -m 5 -X POST "$PING_URL" > /dev/null || true
  sleep 5
done`,
        },
        {
          title: 'Node.js',
          icon: NodeJSIcon,
          language: 'typescript',
          code: `const pingUrl = \`https://api.logdash.io/ping/\${process.env.LOGDASH_MONITOR_ID}\`;

while (true) {
  await processQueue();
  await fetch(pingUrl, { method: 'POST' }).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 5_000));
}`,
        },
        {
          title: 'Python',
          icon: PythonIcon,
          language: 'python',
          code: `import os
import time
import urllib.request

ping_url = f"https://api.logdash.io/ping/{os.environ['LOGDASH_MONITOR_ID']}"

while True:
    process_queue()
    try:
        urllib.request.urlopen(urllib.request.Request(ping_url, method="POST"), timeout=5)
    except OSError:
        pass
    time.sleep(5)`,
        },
      ],
    },
    {
      type: 'paragraph',
      text: 'Ping after the work, not from a timer next to it. A timer keeps pinging while the work is stuck, so the monitor stays up for the whole outage. A ping that only follows finished work stops when the work stops.',
    },
    { type: 'heading', text: 'When a heartbeat monitor goes down' },
    {
      type: 'paragraph',
      text: 'Logdash looks at each heartbeat monitor once per check interval, which is 15 seconds on Pro. A window with at least one ping is a healthy check. A window with no ping is a failed check with the message "Did not receive call for this time range". More pings in one window count as one.',
    },
    {
      type: 'paragraph',
      text: 'Like every monitor, a heartbeat monitor is down after 2 failed checks in a row, so Logdash alerts you about 30 seconds after the last ping. The first ping after that brings it back up and sends a recovery alert.',
    },
    {
      type: 'callout',
      tone: 'warning',
      text: 'The window is fixed, so a heartbeat monitor does not fit a job that runs every hour or every night: it would be down between runs. For a scheduled job, have it ping from inside a long-running process, or check an endpoint that reports when the job last succeeded with an [uptime monitor](/docs/monitoring).',
    },
    { type: 'heading', text: 'Responses' },
    {
      type: 'table',
      headers: ['Status', 'Meaning'],
      rows: [
        ['`201`', 'The ping counts for the current window.'],
        ['`400`', 'The monitor ID is malformed.'],
        [
          '`404`',
          '"Push monitor not found". No heartbeat monitor has this ID.',
        ],
        [
          '`429`',
          'More than 300 requests in a minute from one IP address. A ping every few seconds is far below that.',
        ],
      ],
    },
    {
      type: 'paragraph',
      text: 'Anyone who knows the endpoint can ping it, so keep it in an environment variable, not in a public repository.',
    },
  ],
};
