import CodeIcon from '$lib/domains/shared/icons/CodeIcon.svelte';
import ShieldCheckIcon from '$lib/domains/shared/icons/ShieldCheckIcon.svelte';
import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/status-pages',
  title: 'Status pages',
  metaTitle: 'Status pages | Logdash Docs',
  description:
    'Publish a status page for your monitors, choose what it shows and serve it from your own domain, such as status.example.com.',
  keywords:
    'status page, public status page, hosted status page, status page custom domain, logdash status page',
  blocks: [
    {
      type: 'paragraph',
      text: 'A status page shows your users which of your services are up. Logdash hosts it, keeps it in sync with your [monitors](/docs/monitoring) and computes every status on its servers, so the page, its badges and its API always agree.',
    },
    {
      type: 'paragraph',
      text: 'Visitors see the overall status, then one row per monitor with its status, its uptime and a bar for each of the last 90 days. Hover a bar for the details of that day.',
    },
    { type: 'heading', text: 'Create a status page' },
    {
      type: 'steps',
      items: [
        {
          title: 'Create it',
          text: 'Open your domain, go to **Status pages** and press **New status page**. The new page shows every monitor of the domain and is private until you publish it.',
        },
        {
          title: 'Name it',
          text: 'Change **Name**, shown in the header of the page, such as the name of your product.',
        },
        {
          title: 'Choose monitors',
          text: 'Under **Monitors**, uncheck the monitors your users should not see, such as internal services. **Add new monitors automatically** puts every monitor you add later on the page too.',
        },
        {
          title: 'Publish it',
          text: 'Under **Visibility**, press **Publish status page**. Anyone with the link can now open it at `https://logdash.io/d/<status-page-id>`.',
        },
      ],
    },
    {
      type: 'paragraph',
      text: '**Unpublish** makes the page private again. A private page answers with "This status page is private", and its badges and API stop answering.',
    },
    { type: 'heading', text: 'Statuses' },
    {
      type: 'paragraph',
      text: 'Each monitor on the page is up, degraded, down or unknown, by the rules on [Uptime monitors](/docs/monitoring#status). The overall status leaves out unknown monitors:',
    },
    {
      type: 'table',
      headers: ['Overall status', 'When'],
      rows: [
        ['Operational', 'Every monitor is up.'],
        ['Degraded', 'Some monitors are down or degraded.'],
        ['Outage', 'Every monitor is down.'],
        ['Unknown', 'No monitor has checks yet.'],
      ],
    },
    {
      type: 'paragraph',
      text: 'Each monitor shows its uptime over 1 hour, 24 hours, 7 days, 30 days and 90 days. The page is cached for up to 60 seconds, so a change can take a minute to show.',
    },
    { type: 'heading', text: 'Use your own domain' },
    {
      type: 'paragraph',
      text: 'On the Pro plan, a status page can answer at an address of your own, such as `status.example.com`. Each status page can have one custom URL.',
    },
    {
      type: 'steps',
      items: [
        {
          title: 'Add your custom URL',
          text: 'Under **Custom URL**, enter the address, such as `status.example.com`, and press **Save**.',
        },
        {
          title: 'Add a DNS record',
          text: 'At your DNS provider, add the `CNAME` record Logdash shows. If you use Cloudflare, set the record to **DNS only**, not proxied.',
          code: {
            language: 'text',
            title: 'DNS record',
            code: 'CNAME status.example.com statuspage.logdash.io',
          },
        },
        {
          title: 'Verify it',
          text: 'Press **Check**. Logdash checks the record every 5 seconds for about 5 minutes. When it shows **Custom URL is live**, your page answers at your address over HTTPS.',
        },
      ],
    },
    {
      type: 'callout',
      text: 'DNS changes can take a while to spread. If Logdash shows "We could not verify your DNS record", check the record, delete the custom URL and add it again to start a new check.',
    },
    { type: 'heading', text: 'Delete a status page' },
    {
      type: 'paragraph',
      text: 'Under **Danger zone**, press **Delete status page**. Its link, its custom URL and its badges stop working. Your monitors and their history stay.',
    },
    { type: 'heading', text: 'Plan limits' },
    {
      type: 'paragraph',
      text: 'The number of status pages counts across all the domains you own.',
    },
    { type: 'plan-limits', key: 'monitoring' },
    { type: 'heading', text: 'Next steps' },
    {
      type: 'cards',
      items: [
        {
          title: 'README badges',
          description:
            'Show the uptime of a status page or a monitor on GitHub.',
          href: '/docs/status-pages/badges',
          icon: ShieldCheckIcon,
        },
        {
          title: 'Build your own status page',
          description:
            'Render the same data in your own design, with your own code.',
          href: '/docs/status-pages/api',
          icon: CodeIcon,
        },
      ],
    },
  ],
};
