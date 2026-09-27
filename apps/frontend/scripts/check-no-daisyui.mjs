import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '../../..');
const ROOTS = [
  'apps/frontend/src',
  'packages/hyper-ui/src',
  'apps/status-page/src',
].map((root) => path.join(REPO, root));

const COMPONENTS = {
  alert: 'dash error horizontal info outline soft success vertical warning',
  avatar: 'group offline online placeholder',
  badge:
    'accent dash error ghost info lg md neutral outline primary secondary sm soft success warning xl xs',
  breadcrumbs: '',
  btn: 'accent active block circle dash disabled error ghost info lg link md neutral outline primary secondary sm soft square success warning wide xl xs',
  card: 'actions body border dash lg md side sm title xl xs',
  carousel: 'center end horizontal item start vertical',
  chat: 'bubble end footer header image start',
  checkbox:
    'accent error info lg md neutral primary secondary sm success warning xl xs',
  collapse: 'arrow close content open plus title',
  countdown: '',
  diff: 'item-1 item-2 resizer',
  divider:
    'accent end error horizontal info neutral primary secondary start success vertical warning',
  dock: 'active label lg md sm xl xs',
  drawer: 'button content end open overlay side toggle',
  dropdown: 'bottom center close content end hover left open right start top',
  fab: 'close flower main-action',
  fieldset: 'label legend',
  'file-input':
    'accent error ghost info lg md neutral primary secondary sm success warning xl xs',
  'floating-label': '',
  footer: 'center horizontal title vertical',
  glass: '',
  hero: 'content overlay',
  indicator: 'bottom center end item middle start top',
  input:
    'accent error ghost info lg md neutral primary secondary sm success warning xl xs',
  join: 'horizontal item vertical',
  kbd: 'lg md sm xl xs',
  label: '',
  link: 'accent error hover info neutral primary secondary success warning',
  list: 'col-grow col-wrap row',
  loading: 'ball bars dots infinity lg md ring sm spinner xl xs',
  mask: 'circle decagon diamond half-1 half-2 heart hexagon hexagon-2 pentagon squircle star star-2 triangle triangle-2 triangle-3 triangle-4',
  menu: 'active disabled dropdown dropdown-show dropdown-toggle focus horizontal lg md sm title vertical xl xs',
  modal: 'action backdrop bottom box end middle open start toggle top',
  navbar: 'center end start',
  progress: 'accent error info neutral primary secondary success warning',
  'radial-progress': '',
  radio:
    'accent error info lg md neutral primary secondary sm success warning xl xs',
  range:
    'accent error info lg md neutral primary secondary sm success warning xl xs',
  rating: 'half hidden lg md sm xl xs',
  select:
    'accent error ghost info lg md neutral primary secondary sm success warning xl xs',
  skeleton: 'text',
  stack: 'bottom end start top',
  stat: 'actions desc figure title value',
  stats: 'horizontal vertical',
  status:
    'accent error info lg md neutral primary secondary sm success warning xl xs',
  step: 'accent error icon info neutral primary secondary success warning',
  steps: 'horizontal vertical',
  swap: 'active flip indeterminate off on rotate',
  tab: 'active content disabled',
  tabs: 'border bottom box lg lift md sm top xl xs',
  table: 'lg md pin-cols pin-rows sm xl xs zebra',
  textarea:
    'accent error ghost info lg md neutral primary secondary sm success warning xl xs',
  timeline: 'box compact end horizontal middle snap-icon start vertical',
  toast: 'bottom center end middle start top',
  toggle:
    'accent error info lg md neutral primary secondary sm success warning xl xs',
  tooltip:
    'accent bottom content error info left open primary right secondary success top warning',
  validator: 'hint',
};

const BARE = new Set(Object.keys(COMPONENTS));
const COMPOUND = new Set(
  Object.entries(COMPONENTS).flatMap(([base, parts]) =>
    parts ? parts.split(' ').map((part) => `${base}-${part}`) : [],
  ),
);

const DAISY_COLOUR = String.raw`(?:base-(?:100|200|300|content)|(?:primary|secondary|accent|neutral|info|success|warning|error)-content|primary|secondary|accent|neutral)`;
const COLOUR_UTILITY = new RegExp(
  String.raw`(?<![\w-])(?:[\w\[\]&*>@.='"()-]+:)*!?-?(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|inset-ring|outline|from|via|to|fill|stroke|divide|decoration|caret|accent|shadow|inset-shadow|drop-shadow|placeholder)-${DAISY_COLOUR}(?:\/[\w.\[\]%]+)?!?(?![\w-])`,
  'g',
);
const COLOUR_VARIABLE = new RegExp(
  String.raw`--color-${DAISY_COLOUR}(?![\w-])`,
  'g',
);
const RADIUS_UTILITY =
  /(?<![\w-])(?:[\w[\]&*>@.-]+:)*!?rounded(?:-[trblse]{1,2})?-(?:box|field|selector)(?![\w-])/g;

const CLASS_TOKEN = /^!?[a-z0-9@:[\]/._%#()=,&>*'-]+!?$/;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(svelte|ts|js|css)$/.test(entry.name) ? [full] : [];
  });

function baseClass(token) {
  return token.replace(/^!|!$/g, '').split(':').at(-1).replace(/^!|!$/g, '');
}

function isDaisyClass(token, bareAllowed) {
  const name = baseClass(token);
  if (COMPOUND.has(name)) return true;
  return bareAllowed && BARE.has(name);
}

function skipString(text, start) {
  const quote = text[start];
  let i = start + 1;
  while (i < text.length && text[i] !== quote) {
    if (text[i] === '\\') i += 1;
    i += 1;
  }
  return i + 1;
}

function balancedEnd(text, start) {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const char = text[i];
    if (char === '"' || char === "'" || char === '`') {
      i = skipString(text, i);
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return text.length;
}

function stringLiterals(code, offset) {
  const found = [];
  const re = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/gs;
  for (const match of code.matchAll(re)) {
    const body = match[2].replace(/\$\{[^}]*\}/g, ' ');
    found.push({ text: body, index: offset + match.index + 1 });
  }
  return found;
}

function objectKeys(code, offset) {
  const found = [];
  const stripped = code.replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/gs, (m) =>
    ' '.repeat(m.length),
  );
  for (const match of stripped.matchAll(/(?<=[{,]\s*)([a-z][\w-]*)\s*:/g)) {
    found.push({ text: match[1], index: offset + match.index });
  }
  return found;
}

function tokensOf(chunk) {
  const tokens = [];
  for (const match of chunk.text.matchAll(/\S+/g)) {
    tokens.push({ token: match[0], index: chunk.index + match.index });
  }
  return tokens;
}

function classAttributeChunks(markup, offset) {
  const chunks = [];
  const re = /(?<=\s)(?:[\w-]*[cC]lass(?:Name)?|class:([\w-]+))(=|(?=[\s/>]))/g;
  for (const match of markup.matchAll(re)) {
    if (match[1]) {
      chunks.push({ text: match[1], index: offset + match.index + 6 });
      continue;
    }
    if (!match[2]) continue;
    const start = match.index + match[0].length;
    const open = markup[start];
    if (open === '"' || open === "'") {
      const end = markup.indexOf(open, start + 1);
      const value = markup.slice(start + 1, end);
      const expressions = [];
      const staticText = value.replace(/\{[^}]*\}/g, (expr, at) => {
        expressions.push({ code: expr, at });
        return ' '.repeat(expr.length);
      });
      chunks.push({ text: staticText, index: offset + start + 1 });
      for (const { code, at } of expressions) {
        chunks.push(...stringLiterals(code, offset + start + 1 + at));
        chunks.push(...objectKeys(code, offset + start + 1 + at));
      }
      continue;
    }
    if (open === '{') {
      const end = balancedEnd(markup, start);
      const code = markup.slice(start, end);
      chunks.push(...stringLiterals(code, offset + start));
      chunks.push(...objectKeys(code, offset + start));
    }
  }
  return chunks;
}

function looksLikeClassList(tokens) {
  if (tokens.length < 2) return false;
  if (!tokens.every(({ token }) => CLASS_TOKEN.test(token))) return false;
  return tokens.some(({ token }) => /[-:]/.test(token));
}

function cssFindings(css, offset) {
  const findings = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
  for (const match of clean.matchAll(/@apply\s+([^;]+);/g)) {
    const chunk = {
      text: match[1],
      index: offset + match.index + match[0].indexOf(match[1]),
    };
    for (const { token, index } of tokensOf(chunk)) {
      if (isDaisyClass(token, true)) findings.push({ token, index });
    }
  }
  for (const match of clean.matchAll(/\.([a-z][a-z0-9-]*)(?![\w-])/g)) {
    const rest = clean.slice(match.index);
    const next = rest.search(/[{};]/);
    if (next === -1 || rest[next] !== '{') continue;
    if (
      /@apply/.test(
        clean.slice(clean.lastIndexOf(';', match.index), match.index),
      )
    )
      continue;
    if (isDaisyClass(match[1], true)) {
      findings.push({ token: `.${match[1]}`, index: offset + match.index });
    }
  }
  return findings;
}

function scriptFindings(code, offset) {
  const findings = [];
  for (const chunk of stringLiterals(code, offset)) {
    const tokens = tokensOf(chunk);
    const bareAllowed = looksLikeClassList(tokens);
    for (const { token, index } of tokens) {
      if (!CLASS_TOKEN.test(token)) continue;
      if (isDaisyClass(token, bareAllowed)) findings.push({ token, index });
    }
  }
  return findings;
}

function markupFindings(markup, offset) {
  const findings = [];
  for (const chunk of classAttributeChunks(markup, offset)) {
    for (const { token, index } of tokensOf(chunk)) {
      if (isDaisyClass(token, true)) findings.push({ token, index });
    }
  }
  return findings;
}

function svelteFindings(text) {
  const findings = [];
  const blocks = /<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let markup = text;
  for (const match of text.matchAll(blocks)) {
    const bodyIndex = match.index + match[0].indexOf('>') + 1;
    findings.push(
      ...(match[1] === 'script'
        ? scriptFindings(match[2], bodyIndex)
        : cssFindings(match[2], bodyIndex)),
    );
    markup =
      markup.slice(0, match.index) +
      ' '.repeat(match[0].length) +
      markup.slice(match.index + match[0].length);
  }
  const withoutComments = markup.replace(/<!--[\s\S]*?-->/g, (m) =>
    ' '.repeat(m.length),
  );
  return [...findings, ...markupFindings(withoutComments, 0)];
}

function colourFindings(text) {
  return [COLOUR_UTILITY, COLOUR_VARIABLE, RADIUS_UTILITY].flatMap((re) =>
    [...text.matchAll(re)].map((match) => ({
      token: match[0],
      index: match.index,
      kind: 'theme utility',
    })),
  );
}

function findingsOf(file, text) {
  const component = file.endsWith('.svelte')
    ? svelteFindings(text)
    : file.endsWith('.css')
      ? cssFindings(text, 0)
      : scriptFindings(text, 0);
  return [
    ...component.map((finding) => ({ ...finding, kind: 'component class' })),
    ...colourFindings(text),
  ];
}

const results = [];
for (const file of ROOTS.flatMap(walk)) {
  const text = fs.readFileSync(file, 'utf8');
  const seen = new Set();
  for (const finding of findingsOf(file, text)) {
    const key = `${finding.index}:${finding.token}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const line = text.slice(0, finding.index).split('\n').length;
    results.push({
      file: path.relative(REPO, file),
      line,
      text: `${path.relative(REPO, file)}:${line}: ${finding.kind}: ${finding.token}`,
    });
  }
}

results.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

if (results.length) {
  console.error(results.map((result) => result.text).join('\n'));
  console.error(
    `${results.length} daisyUI usage(s) in ${new Set(results.map((r) => r.file)).size} file(s), see packages/hyper-ui/src/lib/presentational/README.md`,
  );
  process.exitCode = 1;
} else {
  console.log('no daisyUI: ok');
}
