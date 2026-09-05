export type DowntimeMention = {
  name: string;
  handle: string;
  text: string;
};

/**
 * Illustrative posts for the downtime feed. The people and handles are
 * invented; nothing here quotes a real user.
 */
export const DOWNTIME_MENTIONS: DowntimeMention[] = [
  {
    name: 'Mara Lindqvist',
    handle: '@maralind',
    text: 'Is checkout down for everyone or just me?',
  },
  {
    name: 'Devin Okafor',
    handle: '@devinbuilds',
    text: 'Can’t log in for 20 minutes now. Anyone home?',
  },
  {
    name: 'Priya Natarajan',
    handle: '@priya_n',
    text: 'Third outage this month. Cancelling my plan.',
  },
  {
    name: 'Tomasz Wróbel',
    handle: '@twrobel',
    text: 'Demo in 10 minutes and your API returns 502. Great.',
  },
  {
    name: 'Hannah Boyd',
    handle: '@hannahb',
    text: 'Your status page says all systems go. It isn’t.',
  },
  {
    name: 'Luis Ferreira',
    handle: '@luisf',
    text: 'Paid annual for this and it doesn’t even load.',
  },
  {
    name: 'Aiko Tanaka',
    handle: '@aiko_t',
    text: 'Is anyone from the team even awake?',
  },
  {
    name: 'Sam Whitfield',
    handle: '@samwhit',
    text: 'Moving to a competitor. This is embarrassing.',
  },
  {
    name: 'Noor Haddad',
    handle: '@noorh',
    text: 'Refund. Now.',
  },
  {
    name: 'Elena Petrova',
    handle: '@elenap',
    text: 'Lost an order mid-checkout. Who do I even contact?',
  },
  {
    name: 'Jonas Weber',
    handle: '@jonasw',
    text: 'Hour two of silence. Not a good look.',
  },
  {
    name: 'Grace Achebe',
    handle: '@graceach',
    text: 'Webhooks stopped at 9:40. Nothing on your blog, nothing on X.',
  },
];
