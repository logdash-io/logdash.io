// Fails when a background-color transition sneaks into the frontend or hyper-ui.
//
// Backgrounds snap on hover, focus and selection (see .agents/frontend.md);
// only ink and edges may ease, through `transition-ink`. This script rejects:
//   - transition-colors, transition-all and the bare `transition` utility
//   - transition-[...] naming background or all
//   - CSS transition / transition-property declarations listing
//     background-color, background or all
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = [
  path.resolve(here, '../src'),
  path.resolve(here, '../../../packages/hyper-ui/src'),
];

const CHECKS = [
  {
    name: 'utility eases background-color',
    re: /(?<![\w:/-])(?:[\w:-]+:)?transition(?:-colors|-all|-\[[^\]]*\b(?:background(?:-color)?|all)\b[^\]]*\])(?![\w-])/g,
  },
  {
    // The bare `transition` utility eases every colour and more. Matched only
    // inside a string literal, so prose and the svelte directive pass.
    name: 'bare transition utility',
    re: /(["'`])[^"'`\n]*\1/g,
    token: (match) => match[0].match(/(?<=["'`\s])transition(?=["'`\s])/)?.[0],
  },
  {
    name: 'CSS transition lists background-color',
    re: /transition(?:-property)?\s*:\s*[^;{}]*\b(?:background(?:-color)?|all)\b[^;{}]*/g,
  },
];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(svelte|ts|css)$/.test(entry.name) ? [full] : [];
  });

const findings = [];
for (const file of ROOTS.flatMap(walk)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const check of CHECKS) {
    for (const match of text.matchAll(check.re)) {
      const token = check.token ? check.token(match) : match[0];
      if (!token) continue;
      const line = text.slice(0, match.index).split('\n').length;
      findings.push(
        `${path.relative(process.cwd(), file)}:${line}: ${check.name}: ${token.trim()}`,
      );
    }
  }
}

if (findings.length) {
  console.error(
    `${findings.length} background transition(s), see .agents/frontend.md:\n${findings.join('\n')}`,
  );
  process.exit(1);
}
console.log('background transitions: ok');
