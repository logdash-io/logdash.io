import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const valid = [
  'bg-surface-100-bg border-surface-100-border',
  'hover:bg-surface-100-hover-bg text-fg-muted',
  'ring-surface-root-bg bg-heat-2 text-chart-3',
  'bg-surface-50-border w-px',
];
const invalid = [
  'bg-fg-default',
  'border-surface-100-bg',
  'bg-surface-50-hover-bg',
  'bg-surface-50-border',
  'bg-surface-150-bg border-surface-50-border',
  'text-neutral-500',
  'bg-red-500',
  'bg-(--fg-muted)',
];
const css = ['var(--fg-nope)', 'var(--color-sky-400)'];

const fixtures = fs.mkdtempSync(path.join(os.tmpdir(), 'design-tokens-'));
fs.writeFileSync(
  path.join(fixtures, 'Probe.svelte'),
  [
    ...[...valid, ...invalid].map(
      (classes) => `<div class="${classes}"></div>`,
    ),
    `<style>.x { ${css.map((value) => `color: ${value};`).join(' ')} }</style>`,
  ].join('\n'),
);
const { status, stderr } = spawnSync(
  process.execPath,
  [path.join(here, 'check-design-tokens.mjs'), fixtures],
  { encoding: 'utf8' },
);
fs.rmSync(fixtures, { recursive: true });

const findings = stderr.trim().split('\n').slice(1);
const lineOf = (index) => `Probe.svelte:${index + 1}:`;
assert.equal(status, 1);
valid.forEach((classes, index) =>
  assert.ok(
    !findings.some((finding) => finding.includes(lineOf(index))),
    `valid: ${classes}`,
  ),
);
invalid.forEach((classes, index) =>
  assert.ok(
    findings.some((finding) => finding.includes(lineOf(valid.length + index))),
    `invalid: ${classes}`,
  ),
);
css.forEach((value) =>
  assert.ok(
    findings.some((finding) => finding.includes(value)),
    `invalid: ${value}`,
  ),
);
assert.equal(findings.length, invalid.length + css.length);
console.log('check-design-tokens: self-test ok');
