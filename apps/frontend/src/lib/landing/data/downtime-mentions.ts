export type DowntimeMention = {
  name: string;
  handle: string;
  avatar: string;
  text: string;
  strong: string;
};

/**
 * Illustrative posts for the downtime feed. The people and handles are
 * invented; nothing here quotes a real user. The avatars are generated
 * faces of people who do not exist.
 */
export const DOWNTIME_MENTIONS: DowntimeMention[] = [
  {
    name: 'Mara Lindqvist',
    handle: '@maralind',
    avatar: '/images/downtime/maralind.webp',
    text: 'Is checkout down for everyone or just me?',
    strong: 'down for everyone',
  },
  {
    name: 'Devin Okafor',
    handle: '@devinbuilds',
    avatar: '/images/downtime/devinbuilds.webp',
    text: 'Can’t log in for 20 minutes now. Anyone home?',
    strong: '20 minutes',
  },
  {
    name: 'Priya Natarajan',
    handle: '@priya_n',
    avatar: '/images/downtime/priya_n.webp',
    text: 'Third outage this month. Cancelling my plan.',
    strong: 'Cancelling my plan',
  },
  {
    name: 'Tomasz Wróbel',
    handle: '@twrobel',
    avatar: '/images/downtime/twrobel.webp',
    text: 'Demo in 10 minutes and your API returns 502. Great.',
    strong: 'returns 502',
  },
  {
    name: 'Hannah Boyd',
    handle: '@hannahb',
    avatar: '/images/downtime/hannahb.webp',
    text: 'Your status page says all systems go. It isn’t.',
    strong: 'It isn’t.',
  },
  {
    name: 'Luis Ferreira',
    handle: '@luisf',
    avatar: '/images/downtime/luisf.webp',
    text: 'Paid annual for this and it doesn’t even load.',
    strong: 'doesn’t even load',
  },
  {
    name: 'Aiko Tanaka',
    handle: '@aiko_t',
    avatar: '/images/downtime/aiko_t.webp',
    text: 'Is anyone from the team even awake?',
    strong: 'even awake',
  },
  {
    name: 'Sam Whitfield',
    handle: '@samwhit',
    avatar: '/images/downtime/samwhit.webp',
    text: 'Moving to a competitor. This is embarrassing.',
    strong: 'Moving to a competitor',
  },
  {
    name: 'Noor Haddad',
    handle: '@noorh',
    avatar: '/images/downtime/noorh.webp',
    text: 'Refund. Now.',
    strong: 'Refund. Now.',
  },
  {
    name: 'Elena Petrova',
    handle: '@elenap',
    avatar: '/images/downtime/elenap.webp',
    text: 'Lost an order mid-checkout. Who do I even contact?',
    strong: 'Lost an order',
  },
  {
    name: 'Jonas Weber',
    handle: '@jonasw',
    avatar: '/images/downtime/jonasw.webp',
    text: 'Hour two of silence. Not a good look.',
    strong: 'Hour two of silence',
  },
  {
    name: 'Grace Achebe',
    handle: '@graceach',
    avatar: '/images/downtime/graceach.webp',
    text: 'Webhooks stopped at 9:40. Nothing on your blog, nothing on X.',
    strong: 'Webhooks stopped',
  },
];
