import { getDomain, getHostname } from 'tldts';

export function registrableDomain(host: string): string {
  return (
    getDomain(host, { allowPrivateDomains: true }) ?? getHostname(host) ?? host
  );
}
