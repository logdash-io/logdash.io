export const DOMAIN_SETUP_COOKIE = 'logdash_domain_setup';
export const DOMAIN_SETUP_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const MAX_OPEN_SETUPS = 20;
const CLUSTER_ID = /^[a-f0-9]{24}$/;

export function parseDomainSetups(value: string | undefined): string[] {
  return (value ?? '').split('.').filter((id) => CLUSTER_ID.test(id));
}

export function serializeDomainSetups(ids: string[]): string {
  return [...new Set(ids)].slice(-MAX_OPEN_SETUPS).join('.');
}
