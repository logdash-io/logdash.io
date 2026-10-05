import type { Pathname } from '$app/types';
import type { Component } from 'svelte';
import { comparisons } from '$lib/landing/compare/compare.data';
import {
  LINKS,
  LIVE_DEMO,
  out,
  to,
  type NavTarget,
} from '$lib/landing/nav/nav.data';
import DiscordIcon from '$lib/domains/shared/icons/DiscordIcon.svelte';
import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';
import XIcon from '$lib/domains/shared/icons/XIcon.svelte';

export type HubPath =
  | '/alternatives'
  | '/health-check'
  | '/status-page'
  | '/cron-monitoring'
  | '/monitor'
  | '/monitoring'
  | '/alerts'
  | '/tools'
  | '/learn'
  | '/use-cases';

export type FooterLink = (NavTarget | { kind: 'hub'; path: HubPath }) & {
  title: string;
};

const hub = (path: HubPath) => ({ kind: 'hub', path }) as const;

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export type FooterSocial = {
  label: string;
  href: string;
  icon: Component<{ class?: string }>;
};

/**
 * The footer and the nav point at the same places, so both read their URLs
 * from LINKS and the same NavPath union rather than hand-writing hrefs twice.
 */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { ...to('/features/monitoring'), title: 'Uptime monitoring' },
      { ...to('/features/logging'), title: 'Error logs' },
      { ...to('/features/metrics'), title: 'Response time' },
      { ...LIVE_DEMO, title: 'Live demo' },
      { ...to('/pricing'), title: 'Pricing' },
    ],
  },
  {
    title: 'Docs',
    links: [
      { ...to('/docs'), title: 'Docs' },
      { ...to('/docs/sdks'), title: 'SDKs' },
      { ...to('/docs/self-hosting'), title: 'Self-hosting' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { ...hub('/status-page'), title: 'Status pages' },
      { ...hub('/cron-monitoring'), title: 'Cron monitoring' },
      { ...hub('/health-check'), title: 'Health checks' },
      { ...hub('/monitoring'), title: 'What to monitor' },
      { ...hub('/monitor'), title: 'Platforms' },
      { ...hub('/alerts'), title: 'Alert channels' },
      { ...hub('/tools'), title: 'Free tools' },
      { ...hub('/learn'), title: 'Learn' },
      { ...hub('/use-cases'), title: 'Who it’s for' },
      { ...hub('/alternatives'), title: 'Alternatives' },
    ],
  },
  {
    title: 'Compare',
    links: comparisons.map((comparison) => ({
      ...to(`/vs/${comparison.slug}` as Extract<Pathname, `/vs/${string}`>),
      title: comparison.title,
    })),
  },
  {
    title: 'Company',
    links: [
      { ...out(LINKS.github), title: 'Source code' },
      { ...out(LINKS.discord), title: 'Discord' },
      { ...out(LINKS.statusPage), title: 'Status' },
      { ...out(LINKS.roadmap), title: 'Roadmap' },
      { ...out(LINKS.contact), title: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { ...to('/terms-of-service'), title: 'Terms of use' },
      { ...to('/privacy-policy'), title: 'Privacy policy' },
      { ...to('/cookies-policy'), title: 'Cookies policy' },
    ],
  },
];

export const FOOTER_SOCIALS: readonly FooterSocial[] = [
  { label: 'Logdash on X', href: LINKS.x, icon: XIcon },
  { label: 'Logdash on GitHub', href: LINKS.github, icon: GitHubIcon },
  { label: 'Logdash on Discord', href: LINKS.discord, icon: DiscordIcon },
];
