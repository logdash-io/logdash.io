import { readFileSync } from 'fs';
import { join } from 'path';
import { Font, parse } from 'opentype.js';
import { VirtualBucket } from '../../http-ping-bucket/core/types/virtual-bucket.type';
import { BadgeStatus } from '../core/enums/badge-status.enum';
import { BadgeStyle } from '../core/enums/badge-style.enum';
import { BadgeTheme } from '../core/enums/badge-theme.enum';
import { RenderBadgeDto } from './dto/render-badge.dto';

interface Palette {
  statuses: Record<BadgeStatus, string>;
  background: string;
  border: string;
  text: string;
  mutedText: string;
  track: string;
  markTile: string;
}

interface TextStyle {
  font: Font;
  size: number;
  fill: string;
}

const regularFont = loadFont('Inter-Regular.ttf');
const semiBoldFont = loadFont('Inter-SemiBold.ttf');

const MAX_NAME_CHARACTERS = 64;
const MAX_STATUS_NAME_WIDTH = 220;

const PALETTES: Record<BadgeTheme, Palette> = {
  [BadgeTheme.Light]: {
    statuses: {
      [BadgeStatus.Up]: '#16a34a',
      [BadgeStatus.Degraded]: '#ca8a04',
      [BadgeStatus.Down]: '#dc2626',
      [BadgeStatus.Unknown]: '#a3a3a3',
    },
    background: '#ffffff',
    border: '#d1d9e0',
    text: '#1f2328',
    mutedText: '#59636e',
    track: '#e5e7eb',
    markTile: '#101012',
  },
  [BadgeTheme.Dark]: {
    statuses: {
      [BadgeStatus.Up]: '#22c55e',
      [BadgeStatus.Degraded]: '#eab308',
      [BadgeStatus.Down]: '#ef4444',
      [BadgeStatus.Unknown]: '#6e7681',
    },
    background: '#151b23',
    border: '#3d444d',
    text: '#e6edf3',
    mutedText: '#9198a1',
    track: '#262c36',
    markTile: '#f2f2f3',
  },
};

const CLASSIC_COLORS = {
  label: '#555555',
  text: '#ffffff',
  markTile: '#f2f2f3',
  values: {
    [BadgeStatus.Up]: '#16a34a',
    [BadgeStatus.Degraded]: '#ca8a04',
    [BadgeStatus.Down]: '#dc2626',
    [BadgeStatus.Unknown]: '#9f9f9f',
  },
};

const STATUS_LABELS: Record<BadgeStatus, string> = {
  [BadgeStatus.Up]: 'Operational',
  [BadgeStatus.Degraded]: 'Degraded',
  [BadgeStatus.Down]: 'Down',
  [BadgeStatus.Unknown]: 'Unknown',
};

const PULSE_STYLE =
  '<style>.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2s ease-out infinite}' +
  '@keyframes pulse{from{opacity:.5;transform:scale(1)}to{opacity:0;transform:scale(2.6)}}' +
  '@media (prefers-reduced-motion:reduce){.pulse{display:none}}</style>';

const MARK_LINES =
  '<linearGradient id="mark-top" gradientUnits="userSpaceOnUse" x1="46.69" x2="78.01">' +
  '<stop stop-color="#b5607b"/><stop offset=".5" stop-color="#ed3e10"/><stop offset="1" stop-color="#f45900"/>' +
  '</linearGradient>' +
  '<linearGradient id="mark-middle" gradientUnits="userSpaceOnUse" x1="21.99" x2="63.1">' +
  '<stop stop-color="#1d58f9"/><stop offset=".5" stop-color="#c95860"/><stop offset="1" stop-color="#f55f00"/>' +
  '</linearGradient>' +
  '<linearGradient id="mark-bottom" gradientUnits="userSpaceOnUse" x1="40.93" x2="70.09">' +
  '<stop stop-color="#f35300"/><stop offset=".5" stop-color="#f97b00"/><stop offset="1" stop-color="#fc8d00"/>' +
  '</linearGradient>' +
  '<rect x="46.69" y="34.07" width="31.32" height="5.79" rx="2.89" fill="url(#mark-top)"/>' +
  '<rect x="21.99" y="47.11" width="41.11" height="5.79" rx="2.89" fill="url(#mark-middle)"/>' +
  '<rect x="40.93" y="60.14" width="29.16" height="5.79" rx="2.89" fill="url(#mark-bottom)"/>';

export function renderBadge(dto: RenderBadgeDto): string {
  const sanitizedDto = { ...dto, name: sanitizeName(dto.name) };

  if (dto.style === BadgeStyle.Status) {
    return renderStatus(sanitizedDto);
  }

  if (dto.style === BadgeStyle.Card) {
    return renderCard(sanitizedDto);
  }

  return renderClassic(sanitizedDto);
}

function renderClassic(dto: RenderBadgeDto): string {
  const height = 20;
  const padding = 6;
  const markSize = 12;
  const markGap = 4;

  const label = `uptime ${dto.periodLabel}`;
  const value = dto.uptime === null ? 'no data' : formatUptime(dto.uptime);
  const valueColor = CLASSIC_COLORS.values[getUptimeLevel(dto.uptime)];

  const labelStyle: TextStyle = { font: regularFont, size: 11, fill: CLASSIC_COLORS.text };
  const valueStyle: TextStyle = { font: semiBoldFont, size: 11, fill: CLASSIC_COLORS.text };

  const markInset = (height - markSize) / 2;
  const labelStart = dto.isWhiteLabel ? padding : markInset + markSize + markGap;
  const labelWidth = Math.ceil(labelStart + measureText(label, labelStyle) + padding);
  const valueWidth = Math.ceil(padding + measureText(value, valueStyle) + padding);
  const width = labelWidth + valueWidth;

  return wrapSvg(width, height, `${label}: ${value}`, [
    `<clipPath id="shape"><rect width="${width}" height="${height}" rx="3"/></clipPath>`,
    '<g clip-path="url(#shape)">',
    `<rect width="${labelWidth}" height="${height}" fill="${CLASSIC_COLORS.label}"/>`,
    `<rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueColor}"/>`,
    '</g>',
    dto.isWhiteLabel ? '' : drawMark(markInset, markInset, markSize, CLASSIC_COLORS.markTile),
    drawText(label, labelStart, 14, labelStyle),
    drawText(value, labelWidth + padding, 14, valueStyle),
  ]);
}

function renderStatus(dto: RenderBadgeDto): string {
  const palette = PALETTES[dto.theme];
  const height = 20;
  const textStart = 19;
  const wordGap = 4;
  const markSize = 10;
  const markGap = 6;
  const endPadding = 9;

  const nameStyle: TextStyle = { font: semiBoldFont, size: 11, fill: palette.text };
  const statusStyle: TextStyle = { font: regularFont, size: 11, fill: palette.mutedText };

  const name = truncateText(dto.name, nameStyle, MAX_STATUS_NAME_WIDTH);
  const statusLabel = STATUS_LABELS[dto.status];
  const nameWidth = measureText(name, nameStyle);
  const statusStart = textStart + nameWidth + wordGap;
  const statusEnd = statusStart + measureText(statusLabel, statusStyle);
  const markInset = (height - markSize) / 2;
  const markStart = statusEnd + markGap;
  const width = Math.ceil(
    dto.isWhiteLabel ? statusEnd + endPadding : markStart + markSize + markInset,
  );

  return wrapSvg(width, height, `${dto.name}: ${statusLabel}`, [
    dto.status === BadgeStatus.Unknown ? '' : PULSE_STYLE,
    `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${(height - 1) / 2}" fill="${palette.background}" stroke="${palette.border}"/>`,
    drawStatusDot(10, 10, 3.5, dto.status, palette),
    drawText(name, textStart, 14, nameStyle),
    drawText(statusLabel, statusStart, 14, statusStyle),
    dto.isWhiteLabel
      ? ''
      : drawMark(width - markInset - markSize, markInset, markSize, palette.markTile),
  ]);
}

function renderCard(dto: RenderBadgeDto): string {
  const palette = PALETTES[dto.theme];
  const padding = 16;
  const barStep = 4;
  const barWidth = 3;
  const barsTop = 38;
  const barsHeight = 22;
  const headerBaseline = 25;
  const footerBaseline = 74;
  const nameStart = 31;
  const nameGap = 12;

  const width = padding * 2 + dto.dailyBuckets.length * barStep - (barStep - barWidth);
  const height = 84;
  const contentEnd = width - padding;

  const nameStyle: TextStyle = { font: semiBoldFont, size: 13, fill: palette.text };
  const uptimeValueStyle: TextStyle = { font: semiBoldFont, size: 13, fill: palette.text };
  const uptimeSuffixStyle: TextStyle = { font: regularFont, size: 13, fill: palette.mutedText };
  const footerStyle: TextStyle = { font: regularFont, size: 10, fill: palette.mutedText };
  const markLabelStyle: TextStyle = { font: semiBoldFont, size: 10, fill: palette.mutedText };

  const uptimeValue = dto.uptime === null ? '' : formatUptime(dto.uptime);
  const uptimeSuffix = dto.uptime === null ? 'No data' : ' uptime';
  const uptimeSuffixWidth = measureText(uptimeSuffix, uptimeSuffixStyle);
  const uptimeStart = contentEnd - uptimeSuffixWidth - measureText(uptimeValue, uptimeValueStyle);
  const name = truncateText(dto.name, nameStyle, uptimeStart - nameGap - nameStart);

  const bars = dto.dailyBuckets.map((bucket, index) => {
    const fill = getBucketColor(bucket, palette);
    return `<rect x="${padding + index * barStep}" y="${barsTop}" width="${barWidth}" height="${barsHeight}" rx="1" fill="${fill}"/>`;
  });

  const uptimeTitle = dto.uptime === null ? 'no data' : `${uptimeValue} uptime`;

  return wrapSvg(
    width,
    height,
    `${dto.name}: ${STATUS_LABELS[dto.status]}, ${uptimeTitle} over ${dto.dailyBuckets.length} days`,
    [
      dto.status === BadgeStatus.Unknown ? '' : PULSE_STYLE,
      `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="8" fill="${palette.background}" stroke="${palette.border}"/>`,
      drawStatusDot(20, 21, 4, dto.status, palette),
      drawText(name, nameStart, headerBaseline, nameStyle),
      drawText(uptimeValue, uptimeStart, headerBaseline, uptimeValueStyle),
      drawText(uptimeSuffix, contentEnd - uptimeSuffixWidth, headerBaseline, uptimeSuffixStyle),
      ...bars,
      drawText(`${dto.dailyBuckets.length} days ago`, padding, footerBaseline, footerStyle),
      drawText(
        'Today',
        contentEnd - measureText('Today', footerStyle),
        footerBaseline,
        footerStyle,
      ),
      dto.isWhiteLabel ? '' : drawCardMark(width / 2, footerBaseline, markLabelStyle, palette),
    ],
  );
}

function drawCardMark(
  center: number,
  baseline: number,
  style: TextStyle,
  palette: Palette,
): string {
  const markSize = 10;
  const markGap = 4;
  const label = 'logdash';
  const totalWidth = markSize + markGap + measureText(label, style);
  const start = center - totalWidth / 2;

  return (
    drawMark(start, baseline - 8.5, markSize, palette.markTile) +
    drawText(label, start + markSize + markGap, baseline, style)
  );
}

function drawStatusDot(
  centerX: number,
  centerY: number,
  radius: number,
  status: BadgeStatus,
  palette: Palette,
): string {
  const color = palette.statuses[status];
  const dot = `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}"/>`;

  if (status === BadgeStatus.Unknown) {
    return dot;
  }

  return `<circle class="pulse" cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}"/>${dot}`;
}

function drawMark(x: number, y: number, size: number, tileColor: string): string {
  return (
    `<g transform="translate(${round(x)} ${round(y)}) scale(${size / 100})">` +
    `<rect width="100" height="100" rx="16" fill="${tileColor}"/>${MARK_LINES}</g>`
  );
}

function drawText(text: string, x: number, baseline: number, style: TextStyle): string {
  const pathData = style.font.getPath(text, x, baseline, style.size).toPathData(1);

  return pathData ? `<path fill="${style.fill}" d="${pathData}"/>` : '';
}

function measureText(text: string, style: TextStyle): number {
  return style.font.getAdvanceWidth(text, style.size);
}

function truncateText(text: string, style: TextStyle, maxWidth: number): string {
  if (measureText(text, style) <= maxWidth) {
    return text;
  }

  const characters = Array.from(text);

  while (
    characters.length > 1 &&
    measureText(`${characters.join('').trimEnd()}…`, style) > maxWidth
  ) {
    characters.pop();
  }

  return `${characters.join('').trimEnd()}…`;
}

function sanitizeName(name: string): string {
  const printableName = name.replace(/[\u0000-\u001f\u007f]/g, '').trim();

  return Array.from(printableName).slice(0, MAX_NAME_CHARACTERS).join('');
}

function formatUptime(uptime: number): string {
  const flooredUptime = Math.floor(uptime * 100 + 1e-6) / 100;

  return flooredUptime >= 100 ? '100%' : `${flooredUptime.toFixed(2)}%`;
}

function getUptimeLevel(uptime: number | null): BadgeStatus {
  if (uptime === null) {
    return BadgeStatus.Unknown;
  }

  if (uptime >= 99.9) {
    return BadgeStatus.Up;
  }

  if (uptime >= 99) {
    return BadgeStatus.Degraded;
  }

  return BadgeStatus.Down;
}

function getBucketColor(bucket: VirtualBucket | null, palette: Palette): string {
  const total = bucket ? bucket.successCount + bucket.failureCount : 0;

  if (!bucket || total === 0) {
    return palette.track;
  }

  const uptime = (bucket.successCount / total) * 100;

  if (uptime >= 99.99) {
    return palette.statuses[BadgeStatus.Up];
  }

  if (uptime >= 50) {
    return palette.statuses[BadgeStatus.Degraded];
  }

  return palette.statuses[BadgeStatus.Down];
}

function wrapSvg(width: number, height: number, title: string, elements: string[]): string {
  const escapedTitle = escapeXml(title);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapedTitle}">` +
    `<title>${escapedTitle}</title>${elements.join('')}</svg>`
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function loadFont(fileName: string): Font {
  const buffer = readFileSync(join(__dirname, 'fonts', fileName));

  return parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}
