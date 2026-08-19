import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Hostnames that must never be reachable from a user supplied url, regardless
 * of what DNS currently answers for them.
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
]);

function isBlockedIpv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);

  if (a === 0) return true; // "this" network
  if (a === 10) return true; // RFC1918
  if (a === 127) return true; // loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT, RFC6598
  if (a === 169 && b === 254) return true; // link-local, covers cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast, reserved and broadcast

  return false;
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase().split('%')[0];
  const firstHextet = normalized.split(':')[0];
  const head = firstHextet === '' ? 0 : parseInt(firstHextet, 16);

  // ::, ::1, ::ffff:a.b.c.d and the rest of the reserved ::/8 block
  if (Number.isNaN(head) || head === 0) return true;
  if (head >> 8 === 0xfc || head >> 8 === 0xfd) return true; // unique local, fc00::/7
  if (head >= 0xfe80 && head <= 0xfebf) return true; // link-local, fe80::/10
  if (head >> 8 === 0xff) return true; // multicast, ff00::/8

  return false;
}

/**
 * True for anything that is not a routable public address. Non-ip input is
 * blocked too - callers are expected to resolve hostnames first.
 */
export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);

  if (version === 4) return isBlockedIpv4(ip);
  if (version === 6) return isBlockedIpv6(ip);

  return true;
}

function normalizeHostname(hostname: string): string {
  // the URL parser keeps ipv6 literals wrapped in brackets
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

/**
 * Parses a url and rejects everything that is unsafe without touching the
 * network: non http(s) schemes, blocked hostnames and literal private ips.
 * Returns null when the url must not be used.
 */
export function parseSafeUrl(rawUrl: string): URL | null {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return null;
  }

  const hostname = normalizeHostname(url.hostname).toLowerCase();

  if (!hostname) {
    return null;
  }

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) {
    return null;
  }

  if (isIP(hostname) && isBlockedIp(hostname)) {
    return null;
  }

  return url;
}

export function isSafeUrlSyntax(rawUrl: string): boolean {
  return parseSafeUrl(rawUrl) !== null;
}

/**
 * Request time guard. On top of the syntax checks it resolves the hostname and
 * rejects the url when any of the returned addresses is private. Must be called
 * right before every request, including every redirect hop, because dns answers
 * can change between validation and use.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  const url = parseSafeUrl(rawUrl);

  if (!url) {
    throw new Error(`Blocked request to unsafe url: ${rawUrl}`);
  }

  const hostname = normalizeHostname(url.hostname);

  if (isIP(hostname)) {
    return url;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });

  if (addresses.length === 0) {
    throw new Error(`Blocked request to ${hostname}: hostname did not resolve`);
  }

  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new Error(`Blocked request to ${hostname}: resolves to private address ${address}`);
    }
  }

  return url;
}
