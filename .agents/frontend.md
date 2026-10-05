do NOT add any comments to the code, never.
instead of inline class conditions, use svelte's conditional classes like class={['class1', { 'class2': condition }]}
instead of naming function in the UI handleSomething, use onSomething instead

### 1. Code should read like a newspaper

- The most important logic should come first.
- If a function or component is used in a file, it should be defined _after_ its usage.
- Prioritize top-down readability — group related logic together and avoid jumping around the file.
- In Svelte components with snippets: main HTML template first, then snippet definitions below.

### 2. Respect architectural discipline

- Follow **SOLID principles** wherever applicable.
- Maintain a **clear separation of concerns** — don't mix data fetching, UI, and business logic unless explicitly necessary.
- Distinguish between **smart (container)** and **dumb (presentational)** components.
- Adhere to a **layered architecture**: `ui → application → infrastructure → domain -> shared`, etc.
- **Routes should have minimal HTML markup** — the `/routes` directory should only contain thin wrappers. All actual UI components and markup should live in `lib/domains` for ease of navigation.

### 3. Consistency and standards

- Follow the existing conventions in this codebase: naming, folder structure, import style, etc.
- If something is unclear or missing, **ask for context** before proceeding.
- If you make a decision that deviates from our patterns, briefly explain why.

### 4. UX for devs and users

- Code should be easy to reason about and maintain.
- Prefer clarity over cleverness.
- If something feels clunky, it probably needs to be refactored.

> 🧠 Tip: Write code as if you're the future maintainer — and you’ve forgotten everything.

- never use `.then()`. Always use normal promises,
- always use `Tooltip` from `@logdash/hyper-ui/presentational` instead of daisyui `tooltip` class,
- very important: do not add any comments to the produced code,
- enums keys are in `THIS_CASE`. Enum values are in `this-case`,
- distinguish between dtos and regular interfaces
- keep state type within the state file
- things from /shared shouldn't import anything domain-specific, if more than one domain is using something it should become part of /shared
- always use private/public when defining class methods,
- always include function return type
- do NOT include bootstrap classes, the project is styled with Tailwind on the hyper-ui colour tokens (see "Colour tokens" below) - see hyper-ui `src/lib/styles/components.css` for custom classes. daisyUI is being removed: do not add daisyUI component classes or theme colours (`bg-base-200`, `text-primary`, `btn`, ...); `node scripts/check-no-daisyui.mjs` in `apps/frontend` lists what is left
- respect @deprecated annotations, do not use or extend deprecated code
- do not add new things to logdash.api.ts, it's deprecated. Use infrastructure services instead
- try to use early returns instead of big nested if statements
- use ts-pattern match instead of switch statements
- prefer custom icons from `$lib/domains/shared/icons` over lucide-svelte icons. Create new icon components there when needed. If missing, ask for the icon you need.
- no translucent colours anywhere, only solid tokens: no `text-*/NN`, `bg-*/NN`, `border-*/NN`, `ring-*/NN`, `divide-*/NN`, no `opacity-*` to dim text or icons, no `rgb(... / a)` / `rgba()` / `color-mix(..., transparent)` greys in CSS, and never let an icon inherit a translucent colour from its parent. Translucent greys compound where strokes overlap and go muddy over lit backgrounds. Composite the old value over the surface it sits on and take the nearest token: text /80 → `text-fg-secondary`, /70 and /60 → `text-fg-tertiary`, /50 and /45 → `text-fg-muted`, /40 and /30 → `text-fg-faint`, /20 → `text-fg-disabled`; fills /5 → the surface's `-hover-bg`, /10 to /15 → its `-selected-bg`; lines → its `-border`. `npm run lint` in `apps/frontend` runs `scripts/check-solid-colours.mjs`, which fails the build on any of these. The only translucency that stays is see-through by design (modal scrims, glass headers, fade masks to transparent, box shadows, the hero stage lighting), allowlisted in that script.
- the landing (every route outside `/app*` and `/d/*`) scrolls the document, never a container: reload and back/forward restoration, hash jumps and scroll-to-top are the browser's and SvelteKit's job, `app.html` blocks the first paint until the document is parsed and restores the saved offset at parse end, so read scroll through `window.scrollY` and write through `window.scrollTo`. hyper-ui's `overflow: hidden` on `html, body` is for the app shell only and is undone by the root layout's `html:has(.ld-page)` rule.
- structural lines in the app are hairlines: the `edge` utilities from hyper-ui `main.css` draw 0.5px inset box-shadows instead of 1px borders. `edge` outlines a card, `edge-t|r|b|l|x|y` draw one side, `edge-between` (or `edge-between-x`) separates list children, and `edge-over` puts the outline on `::after` when content such as an image covers the box. They stack with each other and with `shadow-*` and `ring-*`. Their colour is `--edge-color`, which every `bg-surface-*-bg` sets to its own `-border`, so an edge always draws in the border of the nearest painted surface; never set it by hand. A bare `border` with no colour utility draws in `--edge-color` too. Keep real borders for controls whose edge changes colour on focus or error (inputs, selects). Grid dividers drawn with `gap-px` stay 1px in `bg-surface-*-border`, because a half-pixel gap lands between device pixels and disappears.
- backgrounds never ease: no `transition-colors`, `transition-all`, bare `transition`, `transition-[...]` naming `background` or `all`, and no CSS `transition`/`transition-property` that lists `background-color` or `all`. Hover, focus, active and selected fills snap. Text, border, outline, fill and stroke colours may still ease with `transition-ink` (same timing hooks as Tailwind); width, opacity, transform and the like use their own `transition-*` utility. Elements whose hover only swaps the fill carry no transition at all. daisyUI components are narrowed in hyper-ui `components.css` until they are replaced. `npm run lint` in `apps/frontend` runs `scripts/check-background-transitions.mjs`, which fails on any of these.
- never name a third-party site, product or company as the source of a layout, timing, colour, copy or effect anywhere in the repository: not in code, comments, commit messages, PR text, docs or data files. Describe what the thing does and why it is that way. The repository is public, and a comment that says where a design was traced from reads as copying and cannot be taken back once pushed.

### Colour tokens

Every colour comes from a semantic token in `packages/hyper-ui/src/lib/styles/tokens`.
`primitives.css` holds the raw neutral scale, and only `semantic.css` may read it.
The app shell (`data-app-shell`) lifts the scale a step, so the same tokens are lighter inside the app than on the landing.
The app is dark only; a light theme would override the same variables under its own selector.

Surfaces are a depth ladder.
Each rung names its background with `-bg` and its edge with `-border`, so the border that fits `surface-100-bg` is always `surface-100-border`.
Rungs that hold interactive rows also have `-hover-bg` and `-selected-bg`.

| Rung               | `-bg`            | `-hover-bg` | `-selected-bg` | `-border`                 | Use                                                                          |
| ------------------ | ---------------- | ----------- | -------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `surface-root`     | 950 (975 in app) | 900         | 800            | 850                       | the page; in the app, the frame behind the sidebar and the content panel     |
| `surface-25`       | 960              | 950         | 900            | 850                       | wells cut into the app's content panel: a block of related tiles and a chart |
| `surface-50`       | 950              | 900         | 800            | 850                       | the app's content panel, and wells cut into a card                           |
| `surface-100`      | 900              | 800         | 700            | 800                       | cards and panels                                                             |
| `surface-150`      | 800              | 700         | 600            | 700                       | raised fills: chips, segmented control pills, pressed rows inside a card     |
| `surface-200`      | 700              | 600         |                | 600                       | fills raised off `surface-150`: avatars, tiles on a chip                     |
| `surface-elevated` | 900              | 800         | 700            | 800                       | what floats over the page: menus, popovers, dropdowns, modals, tooltips      |
| `surface-input`    | 800              |             |                | 700 (`-hover-border` 600) | text fields and selects                                                      |
| `surface-inverse`  | 100              | 200         |                |                           | light fills: primary buttons, indicator dots and bars                        |

Pick the rung by what the element sits on, not by the colour you want: a row hovered in the sidebar is `hover:bg-surface-root-hover-bg`, the same row on a card is `hover:bg-surface-100-hover-bg`.
An element that paints a surface and draws a border uses that surface's border.
A line that separates content inside a surface uses the border of that surface.
A 1px rule element (`w-px`, `h-px`) or a `gap-px` grid may paint a `-border` token as its background.

Text is `fg-*`:

| Token          | Value | Use                                                    |
| -------------- | ----- | ------------------------------------------------------ |
| `fg-default`   | 100   | text                                                   |
| `fg-secondary` | 300   | resting nav and row text, icons that brighten on hover |
| `fg-tertiary`  | 400   | supporting text                                        |
| `fg-muted`     | 500   | hints, captions, metadata                              |
| `fg-faint`     | 600   | placeholders, quiet separators                         |
| `fg-disabled`  | 700   | disabled text                                          |
| `fg-inverse`   | 950   | text on `surface-inverse-bg`                           |

Intent colours stay plain: `brand` (focus outlines, selected edges), `error`, `success`, `warning`, `info`, and `idle` for a status with nothing to report (unknown, unpublished).
Data colours are `chart-1` to `chart-5` for categorical series and `heat-0` to `heat-3` for a sequential ramp such as a heatmap.
`error-bg` and `error-hover-bg` fill danger buttons.
`--focus-ring` and `--focus-ring-error` are box-shadow values, used as `shadow-(--focus-ring)` or `box-shadow: var(--focus-ring)`.

Each token is registered in hyper-ui `main.css` only in the Tailwind namespaces it belongs to, so the wrong pairing does not exist as a class: `-bg` tokens make `bg-*`, `from-*`, `via-*` and `to-*`; `-border` tokens make `border-*`, `divide-*` and `ring-*`, and `-bg` tokens also make `ring-*` for a cut-out ring in the colour of the surface behind (overlapping avatars); `fg-*` tokens make `text-*`, `fill-*` and `decoration-*`.
Scoped component CSS reads the variables directly: `background-color: var(--surface-100-bg)`.
Raw colours (palette utilities such as `neutral-*` or `red-*`, `white`, `black`, `var(--color-<palette>-*)`) are not used outside the token files, and neither is a token read through an arbitrary value (`bg-(--surface-50-bg)`): every valid pairing exists as a class.
`npm run lint` in `apps/frontend` runs `scripts/check-design-tokens.mjs`, which fails on an unknown or mispaired token, a surface next to another surface's border, a `-hover-` token without a state variant, raw colours and arbitrary token values.
Its allowlist holds the few raw colours that are not interface, such as a white backdrop behind a badge preview.

`rounded-box` and `rounded-field` are `rounded-xl`.

### `packages/status` and `templates/status-page-next`

These ship to customers.
`@logdash/status` is published to npm, the registry components in `packages/status/registry` are copied into customers' apps, and the starter is cloned as a customer's own project.
The rules above are for this app and mostly do not apply there; the general rules in `AGENTS.md` do.

- No hyper-ui, daisyUI, `$lib` icons, `ts-pattern` or any other dependency. `packages/status/src` has no runtime dependencies, and the registry components depend on `@logdash/status` only.
- Style the components with Tailwind and the shadcn/ui CSS variables (`bg-background`, `text-muted-foreground`, `border`), not the hyper-ui colour tokens, so they take on the customer's theme. Only the status colours are fixed: green, amber and red.
- One file per framework in `packages/status/registry`, with no imports between files, so the shadcn CLIs copy them without rewriting paths.
- Format dates in UTC and render relative times after mount, so the server and the browser render the same markup.
- JSDoc on exported functions is welcome: it is what customers read in their editor.
- `packages/status/src/api.generated.ts` and `apps/frontend/static/r` are generated. Change the backend DTOs or the registry sources and regenerate, as `CONTRIBUTING.md` describes.
- `templates/status-page-next/components/status-page.tsx` stays byte-identical to `packages/status/registry/react/status-page.tsx`.
- The starter stays outside the pnpm workspace, and has no lockfile until the first npm release of `@logdash/status`.
