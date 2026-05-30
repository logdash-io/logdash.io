# Landing Page Redesign + Token Foundation — Design Spec

- **Date:** 2026-05-30
- **Branch:** `redesign-landing-page`
- **Status:** Draft for review
- **Author:** szymeo (+ Claude)

---

## 1. Context & Problem

The current logdash landing (`apps/frontend/src/routes/+page.svelte` + `src/lib/landing/*`) is not converting. Concrete diagnosis from reviewing the existing sections:

1. **The hero states a topic, not a promise.** *"How SaaS founders keep their apps healthy"* reads like a blog title — in the first 3 seconds the visitor learns nothing about what they get or why logdash beats the alternative.
2. **It tells five times and shows zero.** `ProblemStatement`, `LogdashDifference`, `WhyLogdash`, `Features`, and `FoundersMemo` all repeat "simple, all-in-one, for makers, not enterprise." Redundant, and the visitor reads a wall of *claims* before ever seeing the product.
3. **The sharpest weapons are buried.** "60-second setup", "one line of SDK", and "$200/mo Datadog" sit mid-page where few scroll.

Separately, the **app shell / navigation** is a known pain point (cramped floating sidebar card, narrow centered content, two competing nav systems). That is captured here as **Phase 2** but is *not* the primary deliverable of this spec.

### Target visitor (validated)
The visitor is **not** comparing logdash to enterprise tools (Datadog / New Relic / Sentry / BetterStack — those read as "enterprise-heavy"). They are choosing between:
- **(C) Flying blind** — `console.log`, no monitoring at all.
- **(D) Rolling their own** — a weekend of Grafana / Prometheus / Loki, then maintaining it forever.

**The enemy is inertia and hassle, not a competitor.** The page must sell against *blindness* and *DIY*, and never frame logdash against enterprise tools (doing so invites the wrong comparison).

---

## 2. Goals / Non-Goals

**Goals**
- A high-conversion landing page that leads with a clear promise and **shows the product immediately** via an interactive demo.
- A reusable **two-tier design-token system** (primitives → semantic), brand color = flamingo, built into `@logdash/hyper-ui`, modeled on the "curie" approach.
- A signature **scroll-reveal demo centerpiece** that doubles as a guided, click-to-explore product tour.
- Copy that sells against **blindness** and **DIY**, in the maker voice.

**Non-Goals (this spec)**
- The full app-shell/nav rework (defined as Phase 2; needs its own design pass + mockups).
- Backend/API changes. Pricing values are product decisions already made ($29/mo, $9/mo billed yearly).
- A new brand identity — the logo stays.

---

## 3. Locked Design Decisions

| Decision | Value |
|---|---|
| **Aesthetic lane** | **Linear-dark** — dark, atmospheric, refined. (Light/"Conductor" lane explored and set aside.) |
| **Mood/atmosphere** | Blended Linear: subtle flamingo top-spotlight + warm aurora from below + faint violet accent + technical grid dissolving outward. All dialed low so they layer, not compete. |
| **Brand color** | Flamingo pink (`--brand`, currently `pink-600` `#db2777`; soft `#ec4899`). |
| **Grey palette** | The warm-grey ramp `--color-grey-50 … 950` provided by szymeo (see §4). |
| **Hero headline** | "**Monitoring for founders who'd rather ship. No Grafana weekend. No enterprise bill.**" |
| **Hero sub** | "Logs, metrics, and uptime in one dashboard. One line of SDK, live in 60 seconds — no agents, no infra, no babysitting." |
| **Centerpiece** | Scroll-reveal: hero text lifts away while a fake-browser-framed demo dashboard **scales** 0.8 → 1.0 (transform scale, *not* width — avoids reflow), rising from a peek at the hero's bottom edge to a padded full-width card. |
| **Frame treatment** | Flamingo **double border**: 1px inner edge @ ~50% + 1.5px bg gap + ~6.5px translucent outer ring @ ~20%. Rounded corners kept (it's a card, not full-bleed). |
| **Demo interactivity** | On reveal it goes "LIVE" (streaming logs) with **pulsing flamingo hotspots** that open **anchored popover** explainers (Linear "teach-yourself-the-value" pattern). |
| **Pricing** | Free **$0**; Pro **$29/mo** or **$9/mo billed yearly** (save 69%), via a Monthly/Yearly toggle defaulting to Yearly. |

Reference prototype (final): `.context/.superpowers/brainstorm/*/content/landing-full*.html` (gitignored).

---

## 4. Design Token System (Foundation)

Today the daisyUI `logdash` theme (`packages/hyper-ui/src/lib/styles/themes.css`) is built directly on Tailwind's stock `neutral` palette + `pink-600`. We replace that with a **two-tier system**:

### Tier 1 — Primitives (raw values, no semantics)
```css
:root {
  --color-grey-50:#fbf9fa; --color-grey-100:#f6f4f4; --color-grey-150:#efedee;
  --color-grey-200:#e9e7e7; --color-grey-250:#dfdddd; --color-grey-300:#d5d3d4;
  --color-grey-350:#bbb9b9; --color-grey-400:#a19f9f; --color-grey-450:#8a8889;
  --color-grey-500:#747273; --color-grey-550:#646363; --color-grey-600:#555454;
  --color-grey-650:#4b4a4a; --color-grey-700:#414040; --color-grey-750:#353434;
  --color-grey-800:#292828; --color-grey-850:#212020; --color-grey-900:#191718;
  --color-grey-950:#080707;
  /* brand */
  --color-flamingo-500:#ec4899; --color-flamingo-600:#db2777; /* + ramp TBD */
}
```

### Tier 2 — Semantic tokens (purpose-based, reference primitives)
e.g. `--surface-base`, `--surface-raised`, `--surface-overlay`, `--border`, `--border-soft`, `--text`, `--text-muted`, `--text-faint`, `--brand`, `--brand-soft`, plus status (`--ok/--warn/--err/--info`). Dark theme maps these onto the grey ramp (base = grey-950, raised = grey-900, etc.); a future light theme can remap the same semantic names.

### daisyUI bridge
The daisyUI theme vars (`--color-base-100/200/300`, `--color-primary`, `--color-base-content`, …) consume the **semantic** layer, not primitives directly. This keeps existing daisyUI-based components working while routing everything through tokens.

- **Where:** `packages/hyper-ui/src/lib/styles/` — primitives in a new `tokens.primitives.css`, semantics in `tokens.semantic.css`, both imported by `main.css` before `themes.css`; `themes.css` updated to reference semantic vars.
- **Migration:** existing components keep using daisyUI classes; only the theme mapping changes. Audit for hard-coded `neutral-*` / raw hex in landing + shell and replace with semantic tokens.

---

## 5. Landing Page — Section Spec

Single scrolling page. New components live in `src/lib/landing/` (replacing/augmenting the current set). Order:

### 5.1 Nav (fixed) + atmosphere
- Fixed, blurred, translucent nav: logo • Features / Pricing / Docs / Changelog • **Get started** (primary).
- Fixed background layer with the blended atmosphere (§3). Implemented as a non-interactive fixed `.bg` so it stays consistent under the pinned hero.

### 5.2 Hero + scroll-reveal demo (centerpiece)
- Pinned scene (`position: sticky` 100vh inside a ~300vh scroll track).
- Centered: status pill, **headline**, **sub**, two CTAs ("Start free →", "Explore live demo"), scroll cue.
- The framed demo peeks at the hero's bottom edge; on scroll, hero text translates up + fades while the frame `translateY`s to center and **scales** 0.8→1.0; past ~55% it reveals (overlay peels) and goes LIVE.
- **Reveal also on hover** of the frame.
- **Hotspots → popovers** on: the red `payments` service (Uptime), the log stream (Logs), the metrics rail (Metrics).
- **Demo source — RESOLVED (jury 6–1, 2026-05-30):** Build a **curated, lightweight landing-only demo component** (no backend, full deterministic control of scroll-scale / peel / hotspot choreography), reusing `@logdash/hyper-ui` primitives and the **established landing-fake pattern** (`FakeLogs.svelte`, `SystemHealth.svelte`, `FakeMonitoringTile.svelte`). Do **NOT** embed the real `ProjectView` / `/demo-dashboard` in the hero — it carries a server `load`, global-state mutation, a live SSE/polling `monitoringState.sync()`, `page.params`/`goto` coupling and visibility listeners, all hostile to above-the-fold LCP and to deterministic animation. The **"Explore live demo" CTA links to the real `/demo-dashboard`** so the authentic, always-current product is one click away (visual-drift risk bounded; the hero demo is a curated marketing surface, not a feature-parity guarantee).
- **Terminology (sharpened):** **"hero demo"** = the curated centerpiece component on the landing; **"demo dashboard"** = the real `/demo-dashboard` route. Keep these distinct in code + copy.
- Respect `prefers-reduced-motion`: fall back to a static, already-revealed framed screenshot (no scroll-scrub).

### 5.3 Proof strip
- Stat row: founders monitoring • events/day • 15s check interval • 60s to first data. **(Numbers are placeholders — need real data before launch.)**
- "Works with your stack" chips: Node.js, Next.js, Python, Go, Rust, Bun, Deno, REST API.

### 5.4 One-line install
- Label "Ridiculously simple" → H2 "Live in 60 seconds. One line, not a weekend."
- Tabbed code block (Node / Python / …). **Use the real current `@logdash/node` API** (per `src/lib/domains/logs/domain/setup-prompt.ts`): `import { Logdash } from '@logdash/node'; const logdash = new Logdash(key); logdash.info(...); logdash.withNamespace('auth')`. ⚠️ The `createLogdash({ apiKey })` + destructured `{ logger, metrics }` form is the **deprecated `@logdash/js-sdk`** API (the repo ships a migration guide *away* from it) — it must **not** appear. Confirm the metrics method name on the new SDK before shipping copy.
- Caption: "That's the whole integration. It just shows up in your dashboard."

### 5.5 Three pillars
- "One dashboard, three superpowers" → cards for **Logs**, **Metrics**, **Uptime**, each framed as an outcome.

### 5.6 The wedge (vs blind / vs DIY)
- "Flying blind costs more than you think" → 3 columns: **Fly blind** (✗), **Roll your own** (✗), **logdash** (✓, highlighted). Directly answers the C/D visitor. No enterprise comparison.

### 5.7 Social proof
- 3 maker testimonials (quote + avatar + name + context). **Placeholder quotes — replace with real ones.**

### 5.8 Pricing
- "One small bill. Not an enterprise contract." + Monthly/Yearly toggle (default Yearly). Free $0 / Pro $29 (or $9 yearly). No credit card.

### 5.9 Founder's Memo
- Keep — it's authentic and on-voice. Tighten to the version in the prototype.

### 5.10 FAQ
- Five objections: host nothing • languages/frameworks • vs Grafana/Prometheus • perf impact (async/fire-and-forget) • free tier.

### 5.11 Final CTA + footer
- Brand-gradient CTA card: "Get your vision back in 60 seconds." + "Start free" + "no credit card."

---

## 6. Phase 2 — App Shell & Navigation Rework (defined, not yet designed)

Captured from the original ask; needs its own mockups + design pass before implementation.

- **Left sidebar:** drop the `ld-card-base` background so it reads as integrated, not a floating boxed card (`ClusterSidebar.svelte`).
- **Center content:** remove the `max-w-4xl` clamp in `ClusterShell.svelte`; let it use full width.
- **Right metrics rail (service page):** keep the single `w-80` rail by default; allow **2 columns at `xl`+ only when there are enough metrics** to justify it (`ProjectView.svelte` / `MetricsTiles.svelte`).
- **Navigation structure problems** to address: two parallel nav systems (flat sidebar services vs per-service top tabs that only appear after entering); duplicate "Settings" (cluster vs service); ambiguous "Home"; boxes-in-boxes cramping. A coherent hierarchy (cluster → service → tab) needs to be reflected in the sidebar.

---

## 7. Technical Approach

- **Stack:** SvelteKit 2 + Svelte 5 (runes) + Tailwind 4 + daisyUI 5, `@logdash/hyper-ui` workspace package.
- **Tokens** land in `hyper-ui` styles (§4) first — foundation for both landing and shell.
- **Landing** rebuilt as focused components under `src/lib/landing/`; `+page.svelte` recomposed to the new section order. Reuse existing primitives where they fit; replace redundant sections (ProblemStatement/WhyLogdash/Features overlap collapses into §5.5/5.6).
- **Scroll interaction:** a small scroll-progress utility driving transforms; guard with `prefers-reduced-motion`. Keep logic in one well-bounded component (e.g. `HeroDemoReveal.svelte`) with the demo dashboard as a child.
- **Hotspot explainers:** a reusable `DemoHotspot` + popover; anchored, one-open-at-a-time, dismiss on outside click.
- **Performance:** transforms/opacity only (no layout thrash); lazy-mount below-fold sections; the live log stream throttled.

---

## 8. Sequencing

1. **Tokens foundation** (§4) — unblocks everything.
2. **Landing redesign** (§5) on top of tokens.
3. **App shell & nav** (§6) — separate design pass + spec, then build.

---

## 9. Open Questions / Placeholders

- **Proof numbers** (founders, events/day) — need real figures.
- **Testimonials** — need real quotes + permission.
- ~~**Demo centerpiece** — live-embed vs curated render~~ → **RESOLVED: curated** (see §5.2; jury 6–1, 2026-05-30).
- ~~**Install snippet** — confirm exact `@logdash/node` API surface~~ → **RESOLVED: `new Logdash(key)`** (see §5.4); only the metrics method name still to confirm.
- **Flamingo ramp** — define full primitive ramp for the brand, or keep single 500/600.
- **Light theme** — out of scope now, but semantic tokens should leave the door open.

---

## 10. Verification

- Browser-verify every interaction (golden path + reduced-motion + mobile) before claiming done; leave dev server running for szymeo to click through.
- Run all relevant CI (lint, `svelte-check`, build) locally and confirm green before committing.
- Screenshots/artifacts under `.context/` (gitignored) only.
