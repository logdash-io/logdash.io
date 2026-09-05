import type { Pathname } from '$app/types';
import { comparisons } from '$lib/landing/compare/compare.data';

export type NavMenuKey = 'product' | 'resources';

/** Only pages the chrome links to: resolve() needs literal paths, not the whole Pathname union. */
export type NavPath =
  | '/features/monitoring'
  | '/features/logging'
  | '/features/metrics'
  | '/demo-dashboard'
  | '/pricing'
  | '/app/quick-setup'
  | '/docs'
  | '/docs/self-hosting'
  | '/guides'
  | '/guides/sdk-migration'
  | '/alternatives'
  | '/health-check'
  | '/terms-of-service'
  | '/privacy-policy'
  | '/cookies-policy'
  | Extract<Pathname, `/docs/${string}`>
  | Extract<Pathname, `/vs/${string}`>;

export type NavTarget =
  | { kind: 'internal'; path: NavPath }
  | { kind: 'external'; href: string };

export type NavItem =
  | {
      kind: 'menu';
      key: NavMenuKey;
      name: string;
      /** The trigger reads as current while the page lives under one of these. */
      activePrefixes: string[];
    }
  | { kind: 'link'; path: '/pricing'; name: string }
  | { kind: 'external'; href: string; name: string };

export type PanelItem = NavTarget & { title: string; description: string };
export type PanelLink = NavTarget & { title: string };

/** A column of title + description items inside the lined card. */
export type PanelColumn = { items: PanelItem[] };

export type NavPanel = {
  /** Two columns of title + description items, inside the lined card. */
  columns: [PanelColumn, PanelColumn];
  /** Plain links in the third column. */
  links: PanelLink[];
  /** Optional row under the card: a badge, a line of text and a link. */
  footer?: {
    badge: string;
    text: string;
    cta: NavTarget & { label: string };
  };
};

export const to = (path: NavPath): NavTarget => ({ kind: 'internal', path });
export const out = (href: string): NavTarget => ({ kind: 'external', href });

export const LINKS = {
  discord: 'https://discord.gg/naftPW4Hxe',
  github: 'https://github.com/logdash-io/logdash.io',
  x: 'https://x.com/logdash_io',
  statusPage: 'https://logdash.io/d/685498e1e0ad21003cb3b2fa',
  roadmap: 'https://insigh.to/b/logdash',
  contact: 'mailto:logdash.contact@gmail.com',
} as const;

/** Left to right, as rendered. Order drives the slide direction between menus. */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    kind: 'menu',
    key: 'product',
    name: 'Product',
    activePrefixes: ['/features', '/demo-dashboard'],
  },
  {
    kind: 'menu',
    key: 'resources',
    name: 'Resources',
    activePrefixes: [
      '/docs',
      '/guides',
      '/alternatives',
      '/health-check',
      '/vs',
    ],
  },
  { kind: 'link', path: '/pricing', name: 'Pricing' },
  { kind: 'external', href: LINKS.contact, name: 'Contact' },
];

export const NAV_PANELS: Record<NavMenuKey, NavPanel> = {
  product: {
    columns: [
      {
        items: [
          {
            ...to('/features/monitoring'),
            title: 'Monitoring',
            description:
              'HTTP checks and cron heartbeats, with alerts that reach you before users notice',
          },
          {
            ...to('/features/logging'),
            title: 'Logging',
            description:
              'Stream and search logs from every service in real time',
          },
        ],
      },
      {
        items: [
          {
            ...to('/features/metrics'),
            title: 'Metrics',
            description:
              'Track counters and gauges for the numbers that matter',
          },
          {
            ...to('/demo-dashboard'),
            title: 'Live demo',
            description: 'Click around a real dashboard, no account needed',
          },
        ],
      },
    ],
    links: [
      { ...out(LINKS.statusPage), title: 'Status page' },
      { ...out(LINKS.roadmap), title: 'Roadmap' },
    ],
    footer: {
      badge: 'New',
      text: 'Monitor any URL without an account',
      cta: { ...to('/app/quick-setup'), label: 'Start monitoring' },
    },
  },
  resources: {
    columns: [
      {
        items: [
          {
            ...to('/docs'),
            title: 'Docs',
            description: 'SDK reference, self-hosting and the raw HTTP API',
          },
          {
            ...to('/guides'),
            title: 'Guides',
            description: 'Set up logging, metrics and monitoring in minutes',
          },
          {
            ...to('/guides/sdk-migration'),
            title: 'Migration guide',
            description:
              'Move from @logdash/js-sdk to the unified @logdash/node',
          },
        ],
      },
      {
        items: [
          {
            ...out(LINKS.discord),
            title: 'Community',
            description: 'Get help and share what you are building on Discord',
          },
          {
            ...out(LINKS.github),
            title: 'Source code',
            description: 'Logdash is open source. Read it, star it, run it',
          },
        ],
      },
    ],
    links: [
      { ...to('/alternatives'), title: 'Alternatives' },
      { ...to('/health-check'), title: 'Health checks' },
      ...comparisons.map((comparison) => ({
        ...to(`/vs/${comparison.slug}` as Extract<Pathname, `/vs/${string}`>),
        title: comparison.title,
      })),
    ],
  },
};

export function menuPosition(key: NavMenuKey): number {
  return NAV_ITEMS.findIndex(
    (item) => item.kind === 'menu' && item.key === key,
  );
}

export function isMenuActive(
  item: Extract<NavItem, { kind: 'menu' }>,
  pathname: string,
): boolean {
  return item.activePrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function hrefOf(target: NavTarget): string {
  return target.kind === 'internal' ? target.path : target.href;
}

export function isCurrentTarget(target: NavTarget, pathname: string): boolean {
  return target.kind === 'internal' && target.path === pathname;
}
