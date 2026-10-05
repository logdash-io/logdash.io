// Fails when frontend or hyper-ui colours step outside the semantic tokens.
//
// Every grey comes from hyper-ui `tokens/semantic.css` (see .agents/frontend.md):
// surfaces end in -bg, their edges in -border, text in fg-*. This script rejects:
//   - a token used with a utility it does not belong to (bg-fg-default,
//     border-surface-100-bg), or one that does not exist. Tailwind drops
//     unknown classes silently, so the allowed pairs are read from the
//     namespaces hyper-ui `main.css` registers each token in
//   - a -border token painted as a background, outside 1px rules and
//     gap-px grids
//   - a surface background next to another surface's border on one element
//   - a -hover- token without a state variant in front of it
//   - raw colours: palette utilities (neutral-*, red-*, ...), white, black and
//     var(--color-<palette>-*); greys and status colours have tokens, data
//     colours are chart-* and heat-*
//   - a token read through an arbitrary value (bg-(--surface-50-bg)), which
//     slips past the namespaces; every valid pairing exists as a class
//   - var(--surface-*) / var(--fg-*) / var(--color-*) names that are not defined
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const HYPER_UI = path.resolve(here, '../../../packages/hyper-ui/src');
const STYLES = path.join(HYPER_UI, 'lib/styles');
const ROOTS =
  process.argv.length > 2
    ? process.argv.slice(2).map((root) => path.resolve(root))
    : [path.resolve(here, '../src'), HYPER_UI];

const theme = fs.readFileSync(path.join(STYLES, 'main.css'), 'utf8');
const semantic = fs.readFileSync(
  path.join(STYLES, 'tokens/semantic.css'),
  'utf8',
);
const primitives = fs.readFileSync(
  path.join(STYLES, 'tokens/primitives.css'),
  'utf8',
);

const UTILITIES = {
  'background-color': ['bg', 'from', 'via', 'to'],
  'border-color': [
    'border',
    'border-t',
    'border-r',
    'border-b',
    'border-l',
    'border-x',
    'border-y',
    'border-s',
    'border-e',
    'divide',
  ],
  'ring-color': ['ring', 'inset-ring'],
  'text-color': ['text'],
  fill: ['fill'],
  'text-decoration-color': ['decoration'],
  color: [
    'bg',
    'from',
    'via',
    'to',
    'border',
    'border-t',
    'border-r',
    'border-b',
    'border-l',
    'border-x',
    'border-y',
    'border-s',
    'border-e',
    'divide',
    'ring',
    'inset-ring',
    'text',
    'fill',
    'stroke',
    'decoration',
    'outline',
    'caret',
    'accent',
    'shadow',
  ],
};

const generated = new Set();
const registered = new Set();
for (const [, namespace, name] of theme.matchAll(
  /^\s*--(background-color|border-color|ring-color|text-color|fill|text-decoration-color|color)-([\w-]+):/gm,
)) {
  registered.add(name);
  for (const utility of UTILITIES[namespace])
    generated.add(`${utility}-${name}`);
}
const defined = new Set(
  [...semantic.matchAll(/^\s*--([\w-]+):/gm)].map((m) => m[1]),
);
for (const [, name] of primitives.matchAll(/^\s*--color-([\w-]+):/gm)) {
  defined.add(`color-${name}`);
}
for (const name of registered) defined.add(`color-${name}`);

const PREFIX = [...new Set(Object.values(UTILITIES).flat())]
  .sort((a, b) => b.length - a.length)
  .join('|');
const TOKEN = String.raw`(?:surface-[\w-]+|fg-[\w-]+|border-(?:subtle|default|strong)|hairline|brand|error(?:-[\w-]+)?|success|warning|info|idle)`;
const UTILITY_RE = new RegExp(
  String.raw`(?<![\w-])((?:[^\s"'\`{}()]+:)?)(${PREFIX})-(${TOKEN})(?:/\d+)?(?![\w-])`,
  'g',
);
const PALETTE = String.raw`(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)`;
const RAW_COLOUR_RE = new RegExp(
  String.raw`(?<![\w-])(?:[^\s"'\`{}()]+:)?(?:${PREFIX})-(?:${PALETTE}-\d+|white|black)(?:/\d+)?(?![\w-])`,
  'g',
);
const ARBITRARY_RE = new RegExp(
  String.raw`(?<![\w-])(?:[^\s"'\`{}()]+:)?(?:${PREFIX})-(?:\(|\[var\()--(?:surface|fg|chart|heat|edge|brand|error|success|warning|info|idle)[\w-]*\)\]?`,
  'g',
);
const RAW_VAR_RE = new RegExp(String.raw`^color-${PALETTE}-`);
const VAR_RE = /var\(\s*--((?:surface|fg|color|border|hairline)[\w-]*)\s*[,)]/g;
const RULE_FILL = /(?<![\w-])(?:gap(?:-[xy])?-px|w-px|h-px)(?![\w-])/;

/** file path substring -> raw colours that are not part of the interface */
const ALLOW = {
  'domains/auth/ui/AuthTestimonial.svelte': ['bg-black', 'text-white'],
  'domains/shared/ui/components/BottomSheet/BottomSheet.svelte': ['bg-black'],
  'setup/status-page/BadgePicker.svelte': ['bg-white'],
};

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(svelte|ts|css)$/.test(entry.name) ? [full] : [];
  });

/** class lists: class attributes, @apply lines and one-line string literals */
const classRegions = (text) => {
  const regions = [];
  const re = /class\s*=\s*(["'{])|@apply\s|(["'`])/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const start = re.lastIndex;
    let end = -1;
    if (match[1] === '{') {
      let depth = 1;
      for (end = start; end < text.length && depth > 0; end++) {
        if (text[end] === '{') depth++;
        else if (text[end] === '}') depth--;
      }
      end--;
    } else if (match[1]) {
      end = text.indexOf(match[1], start);
    } else if (match[2]) {
      const close = text.indexOf(match[2], start);
      const newline = text.indexOf('\n', start);
      end = newline !== -1 && newline < close ? -1 : close;
    } else {
      end = text.indexOf(';', start);
    }
    if (end === -1) continue;
    regions.push({ start, end, body: text.slice(start, end) });
    re.lastIndex = end + 1;
  }
  return regions;
};

const findings = [];
const tokensDir = path.join(STYLES, 'tokens');
for (const file of ROOTS.flatMap(walk)) {
  if (file.startsWith(tokensDir)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const relative = path.relative(process.cwd(), file);
  const report = (index, message) =>
    findings.push(
      `${relative}:${text.slice(0, index).split('\n').length}: ${message}`,
    );
  const allowed =
    Object.entries(ALLOW).find(([key]) => file.includes(key))?.[1] ?? [];
  const regions = classRegions(text);
  const contextOf = (index) =>
    regions.find((r) => r.start <= index && index < r.end)?.body ??
    text.slice(text.lastIndexOf('\n', index) + 1, text.indexOf('\n', index));

  for (const match of text.matchAll(VAR_RE)) {
    if (RAW_VAR_RE.test(match[1])) {
      if (!file.startsWith(STYLES)) {
        report(
          match.index,
          `raw colour var(--${match[1]}), use a semantic token`,
        );
      }
    } else if (!defined.has(match[1])) {
      report(match.index, `var(--${match[1]}) is not a hyper-ui token`);
    }
  }

  for (const match of text.matchAll(UTILITY_RE)) {
    const [token, variant, utility, name] = match;
    if (!generated.has(`${utility}-${name}`)) {
      report(
        match.index,
        `${token} is not a hyper-ui utility (token missing, or used with the wrong utility)`,
      );
      continue;
    }
    if (/-hover-/.test(name) && !variant) {
      report(
        match.index,
        `${token} is a hover token without a state variant (hover:, focus-visible:, group-hover: ...)`,
      );
    }
    if (
      utility === 'bg' &&
      name.endsWith('-border') &&
      !RULE_FILL.test(contextOf(match.index))
    ) {
      report(
        match.index,
        `${token} paints a border colour as a background; only 1px rules and gap-px grids may`,
      );
    }
  }

  for (const match of text.matchAll(RAW_COLOUR_RE)) {
    if (allowed.some((a) => match[0].endsWith(a))) continue;
    report(match.index, `raw colour ${match[0]}, use a semantic token`);
  }

  for (const match of text.matchAll(ARBITRARY_RE)) {
    report(
      match.index,
      `${match[0]} reads a token through an arbitrary value, use its utility class`,
    );
  }

  for (const region of regions) {
    const surfaces = new Set();
    const borders = [];
    for (const match of region.body.matchAll(UTILITY_RE)) {
      const [token, variant, utility, name] = match;
      if (variant) continue;
      const surface = name.match(/^surface-(\w+)-bg$/)?.[1];
      if (utility === 'bg' && surface) surfaces.add(surface);
      const edge = name.match(/^surface-(\w+)-border$/)?.[1];
      if ((utility.startsWith('border') || utility === 'divide') && edge) {
        borders.push({ token, edge, index: region.start + match.index });
      }
    }
    if (!surfaces.size) continue;
    const [surface] = surfaces;
    for (const border of borders) {
      if (surfaces.has(border.edge)) continue;
      report(
        border.index,
        `${border.token} next to bg-surface-${surface}-bg, use border-surface-${surface}-border`,
      );
    }
  }
}

if (findings.length) {
  console.error(
    `${findings.length} design token problem(s), see .agents/frontend.md:\n${findings.join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log('design tokens: ok');
}
