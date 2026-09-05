import type { Pathname } from '$app/types';
import type { Component } from 'svelte';
import { comparisons } from '$lib/landing/compare/compare.data';
import { LINKS, out, to, type NavTarget } from '$lib/landing/nav/nav.data';
import DiscordIcon from '$lib/domains/shared/icons/DiscordIcon.svelte';
import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';
import XIcon from '$lib/domains/shared/icons/XIcon.svelte';

export type FooterLink = NavTarget & { title: string };

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
 * Four columns: the legal links live in
 * the bottom row instead of taking a column of their own.
 */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { ...to('/features/monitoring'), title: 'Monitoring' },
      { ...to('/features/logging'), title: 'Logging' },
      { ...to('/features/metrics'), title: 'Metrics' },
      { ...to('/demo-dashboard'), title: 'Live demo' },
      { ...to('/pricing'), title: 'Pricing' },
    ],
  },
  {
    title: 'Docs',
    links: [
      { ...to('/docs'), title: 'Docs' },
      { ...to('/guides'), title: 'Guides' },
      { ...to('/docs/self-hosting'), title: 'Self-hosting' },
      { ...to('/alternatives'), title: 'Alternatives' },
      { ...to('/health-check'), title: 'Health checks' },
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
];

export const FOOTER_LEGAL: readonly FooterLink[] = [
  { ...to('/terms-of-service'), title: 'Terms of use' },
  { ...to('/privacy-policy'), title: 'Privacy policy' },
  { ...to('/cookies-policy'), title: 'Cookies policy' },
];

export const FOOTER_SOCIALS: readonly FooterSocial[] = [
  { label: 'Logdash on X', href: LINKS.x, icon: XIcon },
  { label: 'Logdash on GitHub', href: LINKS.github, icon: GitHubIcon },
  { label: 'Logdash on Discord', href: LINKS.discord, icon: DiscordIcon },
];
