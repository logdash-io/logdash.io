import { tryPrependProtocol } from '$lib/domains/shared/utils/url';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

export function parseOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(tryPrependProtocol(trimmed));
    const local = LOCAL_HOSTS.includes(url.hostname);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local))
      return null;
    if (url.username || url.password) return null;
    if (!local && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname))
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function websiteUrlFromName(name: string | undefined): string {
  if (!name || !/^[a-z0-9.-]+$/i.test(name)) return '';
  return parseOrigin(name) ?? '';
}
