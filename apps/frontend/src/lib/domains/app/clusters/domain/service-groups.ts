import { registrableDomain } from '../../../shared/utils/registrable-domain';
import { displayUrl, urlHost } from '../../../shared/utils/url';

// ponytail: curated list, a provider missing here shows up as one of the user's own hosts. Swap for a maintained provider dataset when users report misplaced hosts.
export const THIRD_PARTY_DOMAINS = [
  'stripe.com',
  'paypal.com',
  'supabase.co',
  'supabase.com',
  'firebaseio.com',
  'github.com',
  'githubstatus.com',
  'openai.com',
  'anthropic.com',
  'googleapis.com',
  'amazonaws.com',
  'cloudflare.com',
  'twilio.com',
  'sendgrid.net',
  'resend.com',
  'postmarkapp.com',
  'mailgun.net',
  'slack.com',
  'discord.com',
  'auth0.com',
  'clerk.com',
  'sentry.io',
  'algolia.net',
  'shopify.com',
];

const SERVICE_NAME_MAX_LENGTH = 64;

export type ServiceEntry = {
  id: string;
  name: string;
  url?: string;
};

export type ServiceItem = {
  id: string;
  label: string;
  urlLabel: string | null;
  host: string | null;
};

export type ServiceList = {
  services: ServiceItem[];
  dependencies: ServiceItem[];
};

type HostedEntry = {
  entry: ServiceEntry;
  host: string | null;
};

export function listServices(
  entries: ServiceEntry[],
  ownDomain?: string,
): ServiceList {
  const hosted: HostedEntry[] = entries.map((entry) => ({
    entry,
    host: entry.url ? urlHost(entry.url) : null,
  }));
  const own = ownDomain?.trim().toLowerCase();
  const isDependency = ({ host }: HostedEntry): boolean =>
    host !== null &&
    isDependencyHost(host) &&
    registrableDomain(host.replace(/:\d+$/, '')) !== own;
  const owned = hosted.filter((item) => !isDependency(item));
  const hosts = orderHosts([
    ...new Set(owned.flatMap(({ host }) => (host ? [host] : []))),
  ]);
  const rank = ({ host }: HostedEntry): number =>
    host ? hosts.indexOf(host) : hosts.length;

  return {
    services: toItems(owned.sort((a, b) => rank(a) - rank(b))),
    dependencies: toItems(hosted.filter(isDependency)),
  };
}

export function primaryDomain(urls: (string | undefined)[]): string | null {
  const counts = new Map<string, number>();

  for (const url of urls) {
    const host = url ? urlHost(url) : null;

    if (!host || isDependencyHost(host)) {
      continue;
    }

    const domain = registrableDomain(host);
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestCount = 0;

  for (const [domain, count] of counts) {
    if (count > bestCount) {
      best = domain;
      bestCount = count;
    }
  }

  return best;
}

export function domainLabel(
  name: string,
  urls: (string | undefined)[],
): string | null {
  const domain = primaryDomain(urls);

  return domain && domain !== name.trim().toLowerCase() ? domain : null;
}

function isDependencyHost(host: string): boolean {
  const hostname = host.replace(/:\d+$/, '');

  return THIRD_PARTY_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function orderHosts(hosts: string[]): string[] {
  const domains = [...new Set(hosts.map(registrableDomain))];
  const rank = (host: string): number => {
    const domain = registrableDomain(host);

    return domains.indexOf(domain) * 2 + (host === domain ? 0 : 1);
  };

  return [...hosts].sort((a, b) => rank(a) - rank(b));
}

function toItems(hosted: HostedEntry[]): ServiceItem[] {
  return hosted.map(({ entry: { id, name, url }, host }) => {
    if (!url || !host) {
      return { id, label: name, urlLabel: null, host: null };
    }

    return isGeneratedName(name, url, host)
      ? { id, label: displayUrl(url), urlLabel: null, host: null }
      : { id, label: name, urlLabel: displayUrl(url), host };
  });
}

function isGeneratedName(name: string, url: string, host: string): boolean {
  const normalized = name.trim().toLowerCase();

  return [host, `www.${host}`, displayUrl(url)].some(
    (candidate) =>
      candidate.toLowerCase().slice(0, SERVICE_NAME_MAX_LENGTH) === normalized,
  );
}
