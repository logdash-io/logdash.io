export const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const ICON_RELS = ['icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'];
const LINK_TAG = /<link\b[^>]*>/gi;
const ATTRIBUTE = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
const MAX_CANDIDATES = 3;

interface Candidate {
  href: string;
  score: number;
}

function readAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const [, name, double, single, bare] of tag.matchAll(ATTRIBUTE)) {
    attributes[name.toLowerCase()] = (double ?? single ?? bare).replace(/&amp;/g, '&').trim();
  }

  return attributes;
}

function scoreIcon(attributes: Record<string, string>, rels: string[]): number {
  const media = attributes.media ?? '';
  const schemeBonus = media.includes('dark') ? 1 : media.includes('light') ? -1 : 0;
  const sizes = attributes.sizes?.toLowerCase() ?? '';
  const largest = Math.max(0, ...[...sizes.matchAll(/(\d+)x\d+/g)].map(([, size]) => Number(size)));
  const isSvg =
    attributes.type === 'image/svg+xml' ||
    sizes === 'any' ||
    /\.svg(\?|$)|^data:image\/svg/i.test(attributes.href);

  if (!rels.includes('icon')) return 100 + schemeBonus;
  if (isSvg) return 600 + schemeBonus;
  if (largest >= 40) return 500 - largest / 100 + schemeBonus;
  if (largest >= 32) return 400 + schemeBonus;
  if (!largest) return 300 + schemeBonus;

  return 200 + largest + schemeBonus;
}

export function findFaviconUrls(html: string, pageUrl: string): string[] {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd === -1 ? html : html.slice(0, headEnd);
  const candidates: Candidate[] = [];

  for (const [tag] of head.matchAll(LINK_TAG)) {
    const attributes = readAttributes(tag);
    const rels = (attributes.rel ?? '').toLowerCase().split(/\s+/);

    if (!attributes.href || !rels.some((rel) => ICON_RELS.includes(rel))) continue;

    try {
      candidates.push({
        href: new URL(attributes.href, pageUrl).toString(),
        score: scoreIcon(attributes, rels),
      });
    } catch {
      continue;
    }
  }

  const ranked = candidates
    .sort((a, b) => b.score - a.score)
    .map((candidate) => candidate.href)
    .slice(0, MAX_CANDIDATES);

  return [...new Set([...ranked, new URL('/favicon.ico', pageUrl).toString()])];
}

export function sniffImageType(body: Buffer): string | null {
  if (body.length < 4) return null;

  if (body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (body.readUInt32BE(0) === 0x00000100) return 'image/x-icon';
  if (body.toString('latin1', 0, 4) === 'GIF8') return 'image/gif';
  if (body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) return 'image/jpeg';
  if (body.toString('latin1', 0, 4) === 'RIFF' && body.toString('latin1', 8, 12) === 'WEBP') {
    return 'image/webp';
  }

  const text = body.toString('utf8', 0, 2048);
  if (/<svg[\s>]/i.test(text) && !/<html[\s>]/i.test(text)) return 'image/svg+xml';

  return null;
}
