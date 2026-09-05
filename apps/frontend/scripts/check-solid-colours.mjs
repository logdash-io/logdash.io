// Fails when a translucent grey sneaks into the frontend or hyper-ui.
//
// The design system only uses solid steps of the neutral scale (see
// .agents/frontend.md). Translucent greys compound where strokes
// overlap and go muddy over lit backgrounds, so this script rejects:
//   - tailwind alpha modifiers on greys: text-base-content/60, bg-white/5 ...
//   - opacity-60 to opacity-95 in a plain class attribute (tinting text or icons)
//   - rgb()/rgba()/color-mix(..., transparent) greys in CSS, shadows excepted
// Translucency that is see-through by design (scrims, glass, fade masks, stage
// lighting) is allowlisted below, per file and token.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = [
  path.resolve(here, '../src'),
  path.resolve(here, '../../../packages/hyper-ui/src'),
];

const GREY = String.raw`(?:base-content|secondary|base-100|base-200|base-300|neutral(?:-\d+)?|white|black|hairline)`;
const UTILITY = String.raw`(?:text|bg|border(?:-[trblxyse])?|fill|stroke|ring|inset-ring|divide|outline|from|to|via|decoration|accent|caret)`;
const CHECKS = [
  {
    name: 'translucent grey utility',
    re: new RegExp(
      String.raw`(?<![\w/-])${UTILITY}-${GREY}/\d{1,3}(?![\w/])`,
      'g',
    ),
  },
  {
    // A tint sits between 60 and 95; ghosted placeholders and disabled states
    // dim at 50 and below and are states, not colours. Conditional classes
    // (`{cond ? 'opacity-50' : ''}`) are stripped before matching.
    name: 'opacity used as a tint',
    re: /class="[^"]*"/g,
    token: (match) =>
      match[0]
        .replace(/\{[^}]*\}/g, '')
        .match(/(?<![\w:-])opacity-(?:6\d|7\d|8\d|9\d)(?![\w-])/)?.[0],
  },
  {
    // Shadows are excepted: a blurred drop can only be translucent.
    name: 'translucent grey in CSS',
    re: /(?:rgba?\(\s*(?:255[\s,]+255[\s,]+255|0[\s,]+0[\s,]+0|(\d+)[\s,]+\1[\s,]+\1)\s*[,/]\s*0?\.\d+\s*\)|color-mix\([^)]*var\(--color-(?:base-content|base-\d+|neutral(?:-\d+)?|secondary)\)[^)]*\btransparent\b[^)]*\))/g,
    skipDeclaration: /shadow/,
  },
];

/** file path substring -> tokens that may stay translucent there */
const ALLOW = {
  'domains/shared/ui/Modal.svelte': ['bg-base-300/60'],
  'domains/shared/upgrade/UpgradeModal.svelte': ['bg-black/60'],
  'ui/setup/UnifiedSetupOverlay.svelte': ['bg-base-300/80'],
  'ProjectView/UnconfiguredFeatureTile.svelte': ['bg-base-300/60'],
  'ProjectView/ProjectSync.svelte': ['bg-base-300/40'],
  'clusters/ui/ServiceTabsNav.svelte': ['bg-base-300/20'],
  'header/LogsAnalyticsChart.svelte': ['bg-base-200/50'],
  'logs-tile/LogPreviewDrawer.svelte': ['from-base-300/80', 'via-base-300/80'],
  'tiles/monitoring/UptimeSection.svelte': ['via-base-200/60'],
  'landing/hero/Hero.svelte': [
    'color-mix(in srgb, var(--color-base-content) 18%, transparent)',
  ],
};

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(svelte|ts|css)$/.test(entry.name) ? [full] : [];
  });

const findings = [];
for (const file of ROOTS.flatMap(walk)) {
  const text = fs.readFileSync(file, 'utf8');
  const allowed =
    Object.entries(ALLOW).find(([key]) => file.includes(key))?.[1] ?? [];
  for (const check of CHECKS) {
    for (const match of text.matchAll(check.re)) {
      const token = check.token ? check.token(match) : match[0];
      if (!token) continue;
      const before = text.slice(0, match.index);
      const line = before.split('\n').length;
      const declaration = before.slice(
        Math.max(before.lastIndexOf(';'), before.lastIndexOf('{')) + 1,
      );
      if (check.skipDeclaration?.test(declaration)) continue;
      if (allowed.some((a) => token.includes(a))) continue;
      findings.push(
        `${path.relative(process.cwd(), file)}:${line}: ${check.name}: ${token}`,
      );
    }
  }
}

if (findings.length) {
  console.error(
    `${findings.length} translucent grey(s), see .agents/frontend.md:\n${findings.join('\n')}`,
  );
  process.exit(1);
}
console.log('solid colours: ok');
