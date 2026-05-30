# Token Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ad-hoc daisyUI theme (built on Tailwind's stock `neutral` palette + `pink-600`) with a two-tier design-token system — warm-grey + flamingo **primitives** → purpose-based **semantic** tokens → daisyUI bridge — living in `@logdash/hyper-ui`, with zero visual regression.

**Architecture:** Primitives are registered as Tailwind v4 `@theme` colors (`grey-*`, `flamingo-*`) so they're available both as CSS vars and utilities. Semantic tokens (`--surface*`, `--fg*`, `--line*`, `--brand*`) are defined **inside the daisyUI theme block** (so a future light theme can remap the same names) and exposed as Tailwind utilities via `@theme inline`. The daisyUI theme vars (`--color-base-*`, `--color-primary`, …) are re-pointed at the semantic layer. Existing components using `base-*`/`primary`/`neutral-*` classes keep working unchanged.

**Tech Stack:** Tailwind CSS v4, daisyUI 5, SvelteKit 2 / Svelte 5, pnpm workspace (`packages/hyper-ui`).

**Verification model:** This is CSS/theme work — each task's gate is **`pnpm --filter frontend check` + `pnpm --filter frontend build` green** plus, for the final task, **browser visual-parity** (the app + landing must look essentially identical to `origin/main`, now token-driven). No unit tests are fabricated.

**Reference:** spec `docs/superpowers/specs/2026-05-30-landing-redesign-design.md` §4.

---

## File Structure

- **Create** `packages/hyper-ui/src/lib/styles/tokens.primitives.css` — Tier 1: raw grey + flamingo ramps as `@theme` colors. Sole responsibility: primitive values.
- **Create** `packages/hyper-ui/src/lib/styles/tokens.semantic.css` — Tier 2 utility exposure: `@theme inline` mapping semantic utility colors to the runtime semantic vars. Sole responsibility: make semantic tokens usable as Tailwind utilities.
- **Modify** `packages/hyper-ui/src/lib/styles/themes.css` — define the semantic tokens (dark mapping) inside the daisyUI theme block and bridge daisyUI vars onto them.
- **Modify** `packages/hyper-ui/src/lib/styles/main.css` — import the two new files in the correct order.

---

## Task 1: Primitive ramps (`grey-*`, `flamingo-*`)

**Files:**
- Create: `packages/hyper-ui/src/lib/styles/tokens.primitives.css`
- Modify: `packages/hyper-ui/src/lib/styles/main.css`

- [ ] **Step 1: Create the primitives file**

Create `packages/hyper-ui/src/lib/styles/tokens.primitives.css` with exactly:

```css
/* Tier 1 — Primitives. Raw palette values, no semantics.
   Registered as Tailwind @theme colors → available as CSS vars
   (var(--color-grey-500)) AND utilities (bg-grey-500, text-flamingo-600). */
@theme {
  --color-grey-50: #fbf9fa;
  --color-grey-100: #f6f4f4;
  --color-grey-150: #efedee;
  --color-grey-200: #e9e7e7;
  --color-grey-250: #dfdddd;
  --color-grey-300: #d5d3d4;
  --color-grey-350: #bbb9b9;
  --color-grey-400: #a19f9f;
  --color-grey-450: #8a8889;
  --color-grey-500: #747273;
  --color-grey-550: #646363;
  --color-grey-600: #555454;
  --color-grey-650: #4b4a4a;
  --color-grey-700: #414040;
  --color-grey-750: #353434;
  --color-grey-800: #292828;
  --color-grey-850: #212020;
  --color-grey-900: #191718;
  --color-grey-950: #080707;

  /* brand: flamingo ramp (anchored on the existing pink-600 / ec4899) */
  --color-flamingo-300: #f9a8d4;
  --color-flamingo-400: #f472b6;
  --color-flamingo-500: #ec4899;
  --color-flamingo-600: #db2777;
  --color-flamingo-700: #be185d;
}
```

- [ ] **Step 2: Import primitives first in `main.css`**

In `packages/hyper-ui/src/lib/styles/main.css`, add the import immediately after `@import "./tailwind.css";` (primitives must load before anything references them):

```css
@import "./tailwind.css";
@import "./tokens.primitives.css";
@import "./base.css";
@import "./themes.css";
@import "./components.css";
@import "./scrollbar.css";
@import "./animations.css";
@import "./third-party.css";
```

- [ ] **Step 3: Verify build is green**

Run: `pnpm --filter frontend build`
Expected: build completes with no CSS/PostCSS errors (exit 0).

- [ ] **Step 4: Verify the utilities exist**

Run: `pnpm --filter frontend build 2>&1 | tail -5` then sanity-check by grepping the built CSS for a new var:
Run: `grep -rl "color-grey-950" apps/frontend/.svelte-kit apps/frontend/build 2>/dev/null | head -1`
Expected: at least one built artifact references `--color-grey-950` (confirms the primitive shipped).

- [ ] **Step 5: Commit**

```bash
git add packages/hyper-ui/src/lib/styles/tokens.primitives.css packages/hyper-ui/src/lib/styles/main.css
git commit -m "feat(tokens): add grey + flamingo primitive ramps"
```

---

## Task 2: Semantic tokens + daisyUI bridge

**Files:**
- Modify: `packages/hyper-ui/src/lib/styles/themes.css`

This defines the Tier-2 semantic tokens (dark mapping) and re-points the daisyUI theme vars at them. Mappings preserve the current scale positions (base-300=950, base-200=900, base-100=800) so there is **no visual change**.

- [ ] **Step 1: Rewrite the daisyUI theme block**

Replace the entire contents of `packages/hyper-ui/src/lib/styles/themes.css` with:

```css
@plugin 'daisyui';
@plugin 'daisyui/theme' {
  name: "logdash";
  default: true;
  prefersdark: true;
  color-scheme: dark;

  --depth: 0;

  /* ── Tier 2: semantic tokens (DARK mapping → primitives) ──
     A future light theme re-declares these same names against the
     light end of the ramp; everything downstream follows. */
  --surface:          var(--color-grey-950); /* app background */
  --surface-raised:   var(--color-grey-900); /* panels */
  --surface-elevated: var(--color-grey-800); /* cards, inputs */
  --surface-overlay:  var(--color-grey-850); /* popovers, menus */
  --line:             var(--color-grey-800); /* borders */
  --line-soft:        var(--color-grey-850); /* hairline dividers */
  --fg:               var(--color-grey-100); /* primary text */
  --fg-muted:         var(--color-grey-400); /* secondary text */
  --fg-faint:         var(--color-grey-600); /* tertiary text */
  --brand:            var(--color-flamingo-600);
  --brand-soft:       var(--color-flamingo-500);

  /* ── daisyUI bridge → semantic layer ── */
  --root-bg: var(--surface);

  --color-primary: var(--brand);
  --color-primary-content: var(--fg);
  --color-secondary: var(--color-grey-100);
  --color-secondary-content: var(--color-grey-950);

  --color-base-300: var(--surface);
  --color-base-200: var(--surface-raised);
  --color-base-100: var(--surface-elevated);
  --color-base-content: var(--fg);

  --color-success: var(--color-green-600);

  --color-error: var(--color-red-600);
  --color-error-content: var(--color-grey-100);

  --color-warning: var(--color-amber-500);
  --color-warning-content: var(--color-amber-500);

  --color-info: var(--color-blue-600);

  --radius-selector: var(--radius-md);
  --radius-field: var(--radius-xl);
  --radius-box: var(--radius-xl);
}
```

- [ ] **Step 2: Verify build is green**

Run: `pnpm --filter frontend build`
Expected: exit 0, no errors.

- [ ] **Step 3: Verify type-check is green**

Run: `pnpm --filter frontend check`
Expected: exit 0 (no new errors introduced; pre-existing warnings, if any, unchanged).

- [ ] **Step 4: Commit**

```bash
git add packages/hyper-ui/src/lib/styles/themes.css
git commit -m "feat(tokens): define semantic tokens + bridge daisyUI theme onto them"
```

---

## Task 3: Expose semantic tokens as Tailwind utilities

**Files:**
- Create: `packages/hyper-ui/src/lib/styles/tokens.semantic.css`
- Modify: `packages/hyper-ui/src/lib/styles/main.css`

`@theme inline` maps utility color names to the runtime semantic vars (declared in the daisyUI theme block), so utilities like `bg-surface-raised` / `text-fg-muted` / `border-line` resolve to the active theme's values and stay themeable.

- [ ] **Step 1: Create the semantic-utilities file**

Create `packages/hyper-ui/src/lib/styles/tokens.semantic.css` with exactly:

```css
/* Tier 2 exposure — make semantic tokens usable as Tailwind utilities.
   @theme inline keeps them pointing at the runtime vars (themeable),
   so `bg-surface`, `bg-surface-raised`, `text-fg-muted`, `border-line`,
   `bg-brand`, `text-brand-soft`, etc. all work and follow the active theme. */
@theme inline {
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-surface-elevated: var(--surface-elevated);
  --color-surface-overlay: var(--surface-overlay);
  --color-line: var(--line);
  --color-line-soft: var(--line-soft);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-faint: var(--fg-faint);
  --color-brand: var(--brand);
  --color-brand-soft: var(--brand-soft);
}
```

- [ ] **Step 2: Import it after themes in `main.css`**

The semantic vars are declared in `themes.css`, so import the exposure file **after** it:

```css
@import "./tailwind.css";
@import "./tokens.primitives.css";
@import "./base.css";
@import "./themes.css";
@import "./tokens.semantic.css";
@import "./components.css";
@import "./scrollbar.css";
@import "./animations.css";
@import "./third-party.css";
```

- [ ] **Step 3: Verify build is green**

Run: `pnpm --filter frontend build`
Expected: exit 0.

- [ ] **Step 4: Smoke-test a semantic utility resolves**

Temporarily add `<div class="bg-surface-raised text-fg-muted border-line">tok</div>` to `apps/frontend/src/routes/+page.svelte` (top of `AnimatedView`), run `pnpm --filter frontend build`, confirm exit 0, then **revert the temporary div**.
Expected: build succeeds with the utility classes present (proves the utilities are generated). Revert leaves the file unchanged from before this step.

- [ ] **Step 5: Commit**

```bash
git add packages/hyper-ui/src/lib/styles/tokens.semantic.css packages/hyper-ui/src/lib/styles/main.css
git commit -m "feat(tokens): expose semantic tokens as tailwind utilities"
```

---

## Task 4: Visual-parity verification

No code change — this task proves the refactor is non-breaking and is the acceptance gate for the foundation.

**Files:** none (verification only)

- [ ] **Step 1: Lint + check + build all green**

Run: `pnpm --filter frontend lint && pnpm --filter frontend check && pnpm --filter frontend build`
Expected: all exit 0. If `lint` reports pre-existing issues unrelated to these four files, note them but do not fix here.

- [ ] **Step 2: Start the dev server**

Run: `pnpm --filter frontend dev`
Expected: server boots (note the local URL).

- [ ] **Step 3: Browser-verify parity (golden path + edge)**

In the browser, compare against how the app looks on `origin/main`:
- **Landing `/`** — hero, cards, primary buttons (flamingo), text contrast all unchanged.
- **App dashboard** (a cluster/service page) — sidebar, cards (`base-100/200/300`), logs, metric tiles render with identical colors.
Expected: **no perceptible color/contrast regression** anywhere. Capture before/after screenshots into `.context/` (gitignored).

- [ ] **Step 4: Confirm tokens are actually driving it**

In devtools, inspect the app background element and confirm its color resolves through the chain `--color-base-300 → --surface → --color-grey-950 (#080707)`.
Expected: the computed value is `#080707` and the var chain is present (proves the theme is token-driven, not coincidentally identical).

- [ ] **Step 5: Leave dev server running**

Leave `pnpm --filter frontend dev` running for szymeo to click through (per workspace verification rule). Do not commit (no code change this task).

---

## Self-Review

- **Spec §4 coverage:** primitives (Task 1) ✓; semantic tokens + daisyUI bridge (Task 2) ✓; utility exposure (Task 3) ✓; lives in `hyper-ui/styles`, imported via `main.css` ✓; non-breaking parity gate (Task 4) ✓. Light-theme door left open (semantic names declared per-theme) ✓.
- **Placeholder scan:** every CSS file's full content is inline; commands are exact; no TBDs. ✓
- **Naming consistency:** token names used identically across files — primitives `--color-grey-*`/`--color-flamingo-*`; semantics `--surface`,`--surface-raised`,`--surface-elevated`,`--surface-overlay`,`--line`,`--line-soft`,`--fg`,`--fg-muted`,`--fg-faint`,`--brand`,`--brand-soft`; utility exposure mirrors them as `--color-<name>`. daisyUI bridge consumes only the semantic names. ✓
- **Out of scope (handled in later plans):** migrating hard-coded `neutral-*`/raw-hex usages in landing & shell to semantic utilities happens in those plans (touching those files); the foundation is intentionally non-breaking so it can land first.
