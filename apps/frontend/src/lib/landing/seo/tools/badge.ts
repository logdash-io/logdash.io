import {
  getBadgeUrl,
  type BadgePeriod,
  type BadgeStyle,
} from '$lib/domains/app/projects/domain/public-dashboards/badge';

export type BadgeTheme = 'light' | 'dark';

export type StatusPageTarget = { id: string; pageUrl: string };

const API_BASE_URL = 'https://api.logdash.io';

export function readStatusPage(input: string): StatusPageTarget | null {
  const value = input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
  const id = value.match(/^(?:www\.)?logdash\.io\/d\/(\w+)$/)?.[1] ?? value;

  if (/^[0-9a-f]{24}$/.test(id)) {
    return { id, pageUrl: `https://logdash.io/d/${id}` };
  }

  if (/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(value)) {
    return { id: value, pageUrl: `https://${value}` };
  }

  return null;
}

export function isBadgeKey(input: string): boolean {
  return /^[\w-]{1,64}$/.test(input.trim());
}

export function badgeUrl(
  target: StatusPageTarget,
  badgeKey: string,
  style: BadgeStyle,
  period: BadgePeriod,
  theme: BadgeTheme,
): string {
  return getBadgeUrl(
    `${API_BASE_URL}/public_dashboards/${encodeURIComponent(target.id)}`,
    encodeURIComponent(badgeKey.trim()),
    style,
    period,
    theme,
  );
}

export function badgeSnippets(
  target: StatusPageTarget,
  imageUrl: string,
  style: BadgeStyle,
): { markdown: string; html: string } {
  const alt = style === 'classic' ? 'Uptime' : 'Status';

  return {
    markdown: `[![${alt}](${imageUrl})](${target.pageUrl})`,
    html: `<a href="${target.pageUrl}"><img src="${imageUrl}" alt="${alt}"></a>`,
  };
}
