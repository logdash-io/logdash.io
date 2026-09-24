export type BadgeStyle = 'classic' | 'status' | 'card';

export type BadgePeriod = '24h' | '7d' | '30d' | '90d';

type BadgeTheme = 'light' | 'dark';

export type BadgeSnippetOptions = {
  statusPageUrl: string;
  badgeKey: string;
  monitorName: string;
  style: BadgeStyle;
  period: BadgePeriod;
  matchTheme: boolean;
};

export const BADGE_STYLES: { value: BadgeStyle; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'status', label: 'Status' },
  { value: 'card', label: 'Card' },
];

export const BADGE_PERIODS: { value: BadgePeriod; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

export function hasThemes(style: BadgeStyle): boolean {
  return style !== 'classic';
}

export function getBadgeUrl(
  statusPageUrl: string,
  badgeKey: string,
  style: BadgeStyle,
  period: BadgePeriod,
  theme: BadgeTheme,
): string {
  const searchParams = new URLSearchParams({ style });

  if (hasThemes(style)) {
    searchParams.set('theme', theme);
  } else {
    searchParams.set('period', period);
  }

  return `${statusPageUrl}/badges/${badgeKey}.svg?${searchParams}`;
}

export function getBadgeSnippet(options: BadgeSnippetOptions): string {
  const alt = `${options.monitorName} ${options.style === 'classic' ? 'uptime' : 'status'}`;
  const lightUrl = getBadgeUrl(
    options.statusPageUrl,
    options.badgeKey,
    options.style,
    options.period,
    'light',
  );

  if (!hasThemes(options.style) || !options.matchTheme) {
    return `[![${escapeMarkdown(alt)}](${lightUrl})](${options.statusPageUrl})`;
  }

  const darkUrl = getBadgeUrl(
    options.statusPageUrl,
    options.badgeKey,
    options.style,
    options.period,
    'dark',
  );

  return [
    `<a href="${options.statusPageUrl}">`,
    '  <picture>',
    `    <source media="(prefers-color-scheme: dark)" srcset="${darkUrl}">`,
    `    <img alt="${escapeHtml(alt)}" src="${lightUrl}">`,
    '  </picture>',
    '</a>',
  ].join('\n');
}

function escapeMarkdown(text: string): string {
  return text.replace(/[[\]\\]/g, '\\$&');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
