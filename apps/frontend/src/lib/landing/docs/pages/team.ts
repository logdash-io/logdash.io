import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/team',
  title: 'Team members',
  metaTitle: 'Team members | Logdash Docs',
  description:
    'Invite people to a domain as Members or Admins, see who has access and remove people who left.',
  keywords:
    'logdash team, invite team members, roles, collaborators, team seats',
  blocks: [
    {
      type: 'paragraph',
      text: 'Each [domain](/docs/concepts#domains) has its own team. Everyone on it sees the same logs, metrics, monitors, status pages and analytics. The domain works under the plan of its Owner, so people you invite need no paid plan of their own.',
    },
    { type: 'heading', text: 'Roles' },
    {
      type: 'table',
      headers: ['Role', 'Can'],
      rows: [
        [
          'Member',
          'Use everything in the domain: logs, metrics, monitors, alerts, status pages and analytics.',
        ],
        [
          'Admin',
          'Everything a Member can, and also rename the domain, change its color, delete apps, and invite and remove people.',
        ],
        [
          'Owner',
          'Everything an Admin can, and also delete the domain. The person who added the domain is its Owner, and nobody can remove them.',
        ],
      ],
    },
    { type: 'heading', text: 'Invite someone' },
    {
      type: 'steps',
      items: [
        {
          title: 'Open the Team card',
          text: 'Open your domain, go to **Settings** and find the **Team** card. Owners and Admins see it.',
        },
        {
          title: 'Send the invite',
          text: 'Enter the email address of the person, choose **Member** or **Admin** and press **Send**. The invite shows under **Invited**.',
        },
        {
          title: 'Tell them',
          text: 'Logdash does not send an email. Ask the person to sign in to Logdash with a Google or GitHub account that uses that address. They see **Join** with the name of your domain at the top of the app, and press **Accept**.',
        },
      ],
    },
    { type: 'heading', text: 'Seats' },
    {
      type: 'paragraph',
      text: 'The **Team** card shows **Seats**, such as `2 of 3 used`. The Owner and open invites take a seat too. When all seats are taken, the card shows "All seats are taken. Upgrade to invite more people."',
    },
    { type: 'plan-limits', key: 'account' },
    { type: 'heading', text: 'Remove someone' },
    {
      type: 'paragraph',
      text: 'In the **Team** card, press the trash button next to the person and confirm with **Remove member**. They lose access at once, and their [personal API keys](/docs/api-keys) stop reaching the domain. To cancel an invite before it is accepted, press the trash button next to it.',
    },
    {
      type: 'paragraph',
      text: 'An Admin can leave a domain with the trash button next to their own name. Members ask an Owner or an Admin to remove them.',
    },
  ],
};
