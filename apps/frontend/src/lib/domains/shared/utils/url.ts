export function isValidUrl(value: string): boolean {
  try {
    // If no protocol is provided, prepend https://
    const urlString =
      value.startsWith('http://') || value.startsWith('https://')
        ? value
        : `https://${value}`;

    const url = new URL(urlString);

    // Check if protocol is http or https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Check if hostname has at least one dot (like .com, .org, etc) or is localhost
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') {
      return false;
    }

    // Check if hostname is not just a single character
    if (url.hostname.length < 2) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function tryPrependProtocol(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `https://${value}`;
}

export const stripProtocol = (url: string): string => {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://')) {
    return url.slice(7);
  } else if (url.startsWith('https://')) {
    return url.slice(8);
  }
  return url;
};

export function urlHost(value: string): string | null {
  try {
    const { host } = new URL(tryPrependProtocol(value.trim()));

    return host.toLowerCase().replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

export function urlPath(value: string): string {
  try {
    const { pathname, search } = new URL(tryPrependProtocol(value.trim()));

    return `${pathname.replace(/\/+$/, '')}${search}` || '/';
  } catch {
    return '/';
  }
}

export function displayUrl(value: string): string {
  const host = urlHost(value);

  if (!host) {
    return value;
  }

  const path = urlPath(value);

  return path === '/' ? host : `${host}${path}`;
}

const GENERATED_NAME_MAX_LENGTH = 64;

export function isNameFromUrl(name: string, url: string): boolean {
  const host = urlHost(url);

  if (!host) {
    return false;
  }

  const normalized = name.trim().toLowerCase();
  const candidates =
    urlPath(url) === '/'
      ? [host, `www.${host}`, displayUrl(url)]
      : [displayUrl(url)];

  return candidates.some(
    (candidate) =>
      candidate.toLowerCase().slice(0, GENERATED_NAME_MAX_LENGTH) ===
      normalized,
  );
}
