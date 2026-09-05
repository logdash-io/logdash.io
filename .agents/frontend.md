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
- do NOT include bootstrap classes, project is styled with daisyui+tailwind - see hyper-ui `src/lib/styles/components.css` for custom classes
- respect @deprecated annotations, do not use or extend deprecated code
- do not add new things to logdash.api.ts, it's deprecated. Use infrastructure services instead
- try to use early returns instead of big nested if statements
- use ts-pattern match instead of switch statements
- prefer custom icons from `$lib/domains/shared/icons` over lucide-svelte icons. Create new icon components there when needed. If missing, ask for the icon you need.
- no translucent colours anywhere, only solid steps of the neutral scale: no `text-*/NN`, `bg-*/NN`, `border-*/NN`, `ring-*/NN`, `divide-*/NN`, no `opacity-*` to dim text or icons, no `rgb(... / a)` / `rgba()` / `color-mix(..., transparent)` greys in CSS, and never let an icon inherit a translucent colour from its parent. Translucent greys compound where strokes overlap and go muddy over lit backgrounds. Composite the old value over the surface it sits on and take the nearest neutral step. On the page (base-300): text /80 → `text-neutral-300`, /70 and /60 → `text-neutral-400`, /50 and /45 → `text-neutral-500`, /40 and /30 → `text-neutral-600`, /20 → `text-neutral-700`; fills /5 → `bg-neutral-900`, /10 to /15 → `bg-neutral-800`; lines up to /10 → `border-hairline`, /20 → `border-neutral-700`, /30 → `border-neutral-600`. On a card (base-200) fills go one step lighter and /40 text is `text-neutral-500`. `npm run lint` in `apps/frontend` runs `scripts/check-solid-colours.mjs`, which fails the build on any of these. The only translucency that stays is see-through by design (modal scrims, glass headers, fade masks to transparent, box shadows, the hero stage lighting), allowlisted in that script.
- the landing (every route outside `/app*` and `/d/*`) scrolls the document, never a container: reload and back/forward restoration, hash jumps and scroll-to-top are the browser's and SvelteKit's job, `app.html` blocks the first paint until the document is parsed and restores the saved offset at parse end, so read scroll through `window.scrollY` and write through `window.scrollTo`. hyper-ui's `overflow: hidden` on `html, body` is for the app shell only and is undone by the root layout's `html:has(.ld-page)` rule.
- backgrounds never ease: no `transition-colors`, `transition-all`, bare `transition`, `transition-[...]` naming `background` or `all`, and no CSS `transition`/`transition-property` that lists `background-color` or `all`. Hover, focus, active and selected fills snap. Text, border, outline, fill and stroke colours may still ease with `transition-ink` (same timing hooks as Tailwind); width, opacity, transform and the like use their own `transition-*` utility. Elements whose hover only swaps the fill carry no transition at all. daisyUI components are narrowed in hyper-ui `components.css` until they are replaced. `npm run lint` in `apps/frontend` runs `scripts/check-background-transitions.mjs`, which fails on any of these.
