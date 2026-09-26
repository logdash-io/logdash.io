# Presentational components

Svelte 5 components with scoped CSS that read the semantic tokens in `../styles/tokens/semantic.css`.
They replace daisyUI; this file maps every daisyUI class still in use to its component so migrations stay mechanical.

Shared conventions:

- Every component takes `class` and spreads the remaining attributes onto its root (for form controls: onto the control itself).
- Styles sit in `@layer components`, so Tailwind utilities passed through `class` override them, the same way they overrode daisyUI.
- Class names carry an `ld-` prefix so they never collide with daisyUI or Tailwind utilities while both are still loaded.
- Focus is a `--focus-ring` halo on `:focus-visible` (text fields and selects also switch their border to `--brand`).
- For element access, pass an attachment: `{@attach fromAction(autoFocus, () => options)}` reaches the underlying element through the spread.

## Forms, disclosure and containers

Import from `@logdash/hyper-ui/presentational`.

### Checkbox

Props: `checked` (bindable, default `false`), `size: "xs" | "sm"` (default `"sm"`), `variant: "default" | "primary"` (default `"default"`), rest onto `<input type="checkbox">`.

| daisyUI                                  | Component                                   |
| ---------------------------------------- | ------------------------------------------- |
| `checkbox checkbox-xs`                   | `<Checkbox size="xs" />`                    |
| `checkbox checkbox-sm`                   | `<Checkbox />`                              |
| `checkbox-primary`, `checkbox-secondary` | `variant="primary"` (both looked identical) |

`checked={x}` with `onchange` keeps working; `bind:checked` works too.
Extra utilities such as `border-neutral-600 checked:border-primary` stay on `class`.

### Input

Props: `value` (bindable, `string | number | null`), `size: "sm" | "md"` (default `"md"`), `variant: "filled" | "outline"` (default `"filled"`), `error` (boolean, sets `aria-invalid`), `leading` (snippet), rest onto `<input>`.

| daisyUI / custom class                                                   | Component                                                                                                |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `input`                                                                  | `<Input />`                                                                                              |
| `input input-sm`                                                         | `<Input size="sm" />`                                                                                    |
| `input-error`                                                            | `error`                                                                                                  |
| `input-bordered`, `input-md`, `form-control`                             | drop, they do nothing in daisyUI 5                                                                       |
| `<label class="input …">{icon}<input class="grow" …/></label>`           | `<Input leading={icon} class="flex-1" … />` (`class` goes to the wrapper, attributes to the inner input) |
| `ld-input ld-input-padding`, `input ld-input ld-input-padding`           | `<Input variant="outline" />` (padding is built in)                                                      |
| `ld-input` with its own padding (`py-2 pl-16 pr-3`, `pl-9 pr-10 py-1.5`) | `<Input variant="outline" class="…padding…" />`                                                          |
| `join-item` on an input                                                  | drop, see Join                                                                                           |

Drop the old focus patches (`focus:border-primary/60 focus:outline-0`, `outline-primary focus-within:border-primary ring-0 focus-within:ring-0 focus-within:outline-0`), focus styling is built in.
`use:autoFocus={…}` becomes `{@attach fromAction(autoFocus, () => ({ … }))}` (`fromAction` from `svelte/attachments`).
`SveltyPicker` only accepts a class string (`inputClasses="ld-input ld-input-padding …"`), so the global `.ld-input` in `styles/components.css` has to stay for it, rewritten without `@apply input-md input-ghost`.

### Select

Props: `value` (bindable, `string | number | null`), `size: "sm" | "md"` (default `"md"`), `<option>` children, rest onto `<select>`.

| daisyUI            | Component            |
| ------------------ | -------------------- |
| `select`           | `<Select>…</Select>` |
| `select select-sm` | `<Select size="sm">` |

The open list uses the customizable `base-select` picker where the browser supports it, styled as before.
In the onboarding select keep `border-neutral-700 hover:border-neutral-600` and the fill utility; drop `focus:outline-none focus-visible:border-primary`.

### Label

Props: `children`, rest onto `<label>` (`for` included).

| daisyUI                                 | Component                                                        |
| --------------------------------------- | ---------------------------------------------------------------- |
| `label`                                 | `<Label>`                                                        |
| `<span class="label-text …">` inside it | plain `<span class="…">`, `label-text` does nothing in daisyUI 5 |

### Collapse

Props: `open` (bindable, default `false`), `locked` (renders non-interactive markup, only `open` decides), `title` (snippet), `titleClass`, `contentClass`, `children` (the content), rest onto the root.
Interactive collapses are a native `<details>`/`<summary>`: click, Enter and Space toggle it.

| daisyUI                                                                                                                      | Component                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `<details class="collapse …"><summary class="collapse-title …">T</summary><div class="collapse-content …">C</div></details>` | `<Collapse class="…" titleClass="…" contentClass="…" {open}>{#snippet title()}T{/snippet}C</Collapse>` |
| `div.collapse` with a hidden `<input type="checkbox" bind:checked={open}>`                                                   | `<Collapse bind:open …>` (drop the input)                                                              |
| `collapse collapse-open` with no input                                                                                       | `<Collapse locked open …>`                                                                             |
| `collapse` with `collapse-open: cond` and a conditional checkbox                                                             | `<Collapse locked open={cond} …>` (drop the input)                                                     |

Clicks anywhere in `title` toggle the collapse.
Content that must not toggle it (the ping chart in `MonitorCard`) calls `event.preventDefault()` in its click handler; the old `z-10 cursor-default` overlay trick no longer applies.

### Dropdown

Props: `align: "start" | "center" | "end"` (default `"start"`), `trigger` (snippet receiving `{ popovertarget, style }` to spread onto a button), `children` (the panel), `class` and rest onto the panel.
The panel is a native popover anchored under the trigger: outside click and Escape close it, and so does a click on any link or button inside it.
Browsers without CSS anchor positioning show it centred.

| daisyUI                                                                                           | Component                                                                                                             |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `div.dropdown.dropdown-end` + `div[tabindex=0][role=button]` trigger + `ul.menu.dropdown-content` | `<Dropdown align="end">{#snippet trigger(attrs)}<Button {...attrs} …>…</Button>{/snippet}<Menu …>…</Menu></Dropdown>` |
| `closeDropdown()` blur helper, `z-[1]`                                                            | drop                                                                                                                  |
| `dropdown-content` inside a `Tooltip` snippet                                                     | drop, it has no styles outside a `.dropdown` parent                                                                   |
| `dropdown dropdown-center` on the list inside a `Tooltip` snippet                                 | drop, they only made it `relative inline-block`                                                                       |

### Menu

Props: `size: "sm" | "md"` (default `"md"`), `<li>` children, rest onto `<ul>`.
ArrowDown and ArrowUp move focus across `li > a[href]`, `li > button` and `li > details > summary`, skipping collapsed submenus.
`<li><details><summary>…</summary><ul>…</ul></details></li>` submenus keep working, with the chevron and the nested guide line.
A `Button` inside an `li` keeps its own look.

| daisyUI             | Component          |
| ------------------- | ------------------ |
| `menu`              | `<Menu>`           |
| `menu menu-sm`      | `<Menu size="sm">` |
| `rounded-box` on it | `rounded-xl`       |

`#root .menu` in `components.css` forced 6px padding over `p-2` and `p-4`; the Menu default is 6px, so drop those padding utilities to keep today's look.
Menu links without `href` (Billing in `NavContextMenu` and `SidebarUserProfile`) cannot take keyboard focus; give them their `href`.

### Tabs and Tab

`Tabs` props: `size: "xs" | "sm" | "md"` (default `"md"`), `boxed` (filled track), rest onto the `role="tablist"` element.
ArrowLeft, ArrowRight, Home and End move focus to the next enabled tab and activate it.
`Tab` props: `active` (sets `aria-selected`), rest onto `<button type="button" role="tab">`.

| daisyUI                                                            | Component                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `tabs tabs-box tabs-xs bg-neutral-800 rounded-lg shadow-none`      | `<Tabs size="xs" boxed>` (drop the three utilities, the track fill and 12px radius are built in) |
| `tabs tabs-boxed tabs-sm`                                          | `<Tabs size="sm">` (`tabs-boxed` does nothing in daisyUI 5)                                      |
| `tab`                                                              | `<Tab>`                                                                                          |
| `tab-active`, `tab-active bg-base-100`, `tab-active btn-secondary` | `active` (the selected fill is built in)                                                         |
| `rounded-lg` on a tab                                              | drop                                                                                             |

### Card, CardBody, CardTitle, CardActions

Layout only, no fill: keep `ld-card-bg`, borders and radius utilities on `class`.
`Card` is a rounded flex column, `CardBody` a padded column (24px, 8px gap, `text-sm`) whose paragraphs grow, `CardTitle` an `<h2>` (18px semibold), `CardActions` a wrapping row with an 8px gap.

| daisyUI        | Component       |
| -------------- | --------------- |
| `card`         | `<Card>`        |
| `card-body`    | `<CardBody>`    |
| `card-title`   | `<CardTitle>`   |
| `card-actions` | `<CardActions>` |

### Join

Props: `children`, rest onto the wrapper.
Children sit in an inline flex row, each one after the first overlaps its neighbour by 1px, and the focused one is raised.
Inner corners are squared, so a row of pill buttons reads as one pill; only the outer corners keep the children's own radius.
A group whose items do not share an edge is not a join: `SegmentedControl` (ghost pill toggles) is a plain `inline-flex` row, and a single field with a button laid over it is a plain `relative` wrapper.

| daisyUI     | Component                                                                               |
| ----------- | --------------------------------------------------------------------------------------- |
| `join`      | `<Join>`, or a plain `inline-flex` / `relative` div when the items do not share an edge |
| `join-item` | drop                                                                                    |

### Avatar

Props: `src`, `alt` (default `""`), `children` (fallback when there is no `src`), rest onto the square frame.

| daisyUI                                                                         | Component                                                         |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `div.avatar(.avatar-placeholder) > div.w-8.rounded-full.bg-… > img` or fallback | `<Avatar src={…} class="w-8 rounded-full bg-…">fallback</Avatar>` |
| `avatar placeholder` wrapping a spinner                                         | drop both, `placeholder` does nothing in daisyUI 5                |

### Swap

Props: `active`, `on` and `off` (snippets), rest onto the wrapper.
Crossfades the two snippets with a 45° turn.

| daisyUI                                                                         | Component                                                                                                                                      |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `label.btn.swap.swap-rotate` + hidden checkbox + `.swap-on` / `.swap-off` icons | `<Button …><Swap active={copied}>{#snippet on()}…{/snippet}{#snippet off()}…{/snippet}</Swap></Button>` (drop the checkbox and its `id`/`for`) |

### Divider

Props: optional `children`, rest onto the row.

| daisyUI                                                         | Component                                                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `button.divider.w-full.gap-1.cursor-pointer.hover:text-primary` | `<button type="button" class="block w-full cursor-pointer hover:text-primary"><Divider class="gap-1">…</Divider></button>` |
| `divider-base-100`, `hover:divider-primary/20`                  | drop, neither exists in daisyUI 5                                                                                          |

### Rating

Props: `value` (bindable, `0` means none), `max` (default `5`), `name` (defaults to a unique id), rest onto the `role="radiogroup"` wrapper.
Stars are 20px radio inputs labelled "1 star" to "5 star"; give the group an `aria-label`.

| daisyUI                                                                     | Component                                                                    |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `div.rating.rating-sm` with five `input.mask.mask-star-2.bg-primary` radios | `<Rating bind:value={rating} class="mx-auto gap-0.5" aria-label="Rating" />` |

### Colours that changed

daisyUI drew several of these parts with translucent colours; they are now the nearest solid step over the surface they sit on.

- Text field and select border, 20% over their own fill: `--fg-faint` (neutral-600, was #545455).
- Default checkbox border, 20% over a card: `--border-strong` (neutral-700, was #474749).
- Label text, 60%: `--fg-secondary` (neutral-400, was #989899).
- Unselected tab text, 50%: `--fg-muted` (neutral-500, was #828283 on the page, #8e8e8f on the boxed track).
- Menu item hover and focus, 10% over a card: `--surface-100` (neutral-800, was #323233).
- Nested menu guide line, 10% over a card: `--border-default` (neutral-800, was #323233).
- Option hover in an open select, 10% over its fill: `--surface-150` (neutral-700).
- Divider lines, 10% over the page: `--hairline` (was #272729).
- Unselected rating star, 20% over a card: `--surface-150` (neutral-700, was #474749).
- Disabled text field text, 40%: `--fg-muted`.

`semantic.css` has no border token for neutral-600, so the text field and select border and the outline field's hover border read `--fg-faint`.

### Not built

Nothing in the app uses `toggle`, `range`, `textarea`, `fieldset`, `modal` or `steps`.
The feedback textarea carries no daisyUI class, and `domains/shared/ui/Modal.svelte` already renders a native `<dialog>` without daisyUI classes.

## Actions and feedback

Import from `@logdash/hyper-ui/presentational`.
Variants and sizes are `data-*` attributes on an `ld-*` root, so none of these components carries a daisyUI class name.

### Button

Props: `variant` (default `"secondary"`), `size: "xs" | "sm" | "md" | "lg"` (default `"md"`), `shape: "pill" | "square" | "circle"` (default `"pill"`), `block`, `loading`, `href` (renders `<a>`), `as: "button" | "span"` (default `"button"`), `type` (default `"button"`), `disabled`, `class`, `children`, rest (`onclick`, `data-posthog-id`, `aria-*`, `popovertarget`, …) onto the root.
Variants: `primary`, `secondary`, `subtle`, `neutral`, `ghost`, `transparent`, `outline`, `soft`, `danger`, `danger-ghost`, `danger-soft`, `success-soft`, `link`.
Buttons are pills by default, the one intended change from today; `square` and `circle` keep their shapes.
`loading` disables the button, hides the label without changing the width and centres a spinner; the label stays the accessible name and `aria-busy` is set.
A disabled `href` button renders an `<a>` without `href` and with `aria-disabled="true"`.
Press feedback (`utils/press.ts`) is attached per button, so it does not depend on `installPressFeedback`.
Focus keeps today's 2px `--brand` outline with a 2px offset, not the `--focus-ring` halo.

| daisyUI                                           | Component                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `btn` (no colour class)                           | `<Button>` (`secondary` is the default)                                 |
| `btn-primary`, `btn-secondary`                    | `variant="primary"` (both were the same white fill)                     |
| `btn-subtle`                                      | `variant="subtle"`                                                      |
| `btn-neutral`                                     | `variant="neutral"`                                                     |
| `btn-ghost`                                       | `variant="ghost"`                                                       |
| `btn-transparent`                                 | `variant="transparent"`                                                 |
| `btn-primary btn-outline`                         | `variant="outline"`                                                     |
| `btn-secondary btn-soft`, `btn-soft`              | `variant="soft"`                                                        |
| `btn-error`                                       | `variant="danger"`                                                      |
| `btn-error btn-outline`                           | `variant="danger-ghost"` (it never drew a border)                       |
| `btn-error btn-soft`                              | `variant="danger-soft"`                                                 |
| `btn-success btn-soft`                            | `variant="success-soft"`                                                |
| `btn-link`                                        | `variant="link"` (unused today)                                         |
| `btn-xs`, `btn-sm`, `btn-lg`                      | `size="xs"`, `size="sm"`, `size="lg"`                                   |
| `btn-md`                                          | drop                                                                    |
| `btn-square`, `btn-circle`                        | `shape="square"`, `shape="circle"`                                      |
| `w-full`, `btn-block`                             | `block`                                                                 |
| `btn-disabled`, `disabled`                        | `disabled`                                                              |
| `btn-secondary-disabled`                          | drop, it is not a daisyUI class and rendered as a bare `btn`            |
| `rounded-full`                                    | drop, pills are the default                                             |
| `<a class="btn …" href>`                          | `<Button href={…}>`                                                     |
| `<span class="btn …">` inside a link              | `<Button as="span">`                                                    |
| `<div class="btn …" role="button" tabindex="0">`  | `<Button>` (a real button)                                              |
| `{#if busy}<span class="loading …">{/if}` + label | `loading={busy}` (keep a `<Spinner>` child only if the label must show) |

Everything else stays on `class` and wins over the component: `gap-2`, `px-5`, `h-11`, `font-medium`, `justify-between`, `text-neutral-400`, `hover:text-error`, `bg-…`, margins and flex utilities.
Classes applied through props of other components (`UpgradeElement class={['btn …']}`) need the markup changed to wrap a `<Button>`.

### Spinner

Props: `size: "xs" | "sm" | "md" | "lg" | "xl"` (default `"md"`, 16/20/24/28/32px), `variant: "spinner" | "ring" | "infinity"` (default `"spinner"`), `class`, rest onto the `<span>`.
It is the same masked SVG as daisyUI, painted in `currentColor`.
It renders `role="status"` with `aria-label="Loading"`; pass `aria-hidden="true"` when a visible label already says what is loading.

| daisyUI                                                        | Component                                        |
| -------------------------------------------------------------- | ------------------------------------------------ |
| `loading loading-spinner loading-{xs,sm,md,lg}`                | `<Spinner size="…" />`                           |
| `loading loading-sm` (no type)                                 | `<Spinner size="sm" />`                          |
| `loading loading-spinner size-3.5`, `w-3`, `h-4 w-4`           | `<Spinner class="size-3.5" />` (sizes via class) |
| `loading loading-ring loading-{sm,xl}`                         | `<Spinner variant="ring" size="…" />`            |
| `loading loading-infinity loading-xl`                          | `<Spinner variant="infinity" size="xl" />`       |
| `text-…`, `shrink-0`, `ml-auto`, `absolute …`, `duration-1000` | stay on `class` (`duration-1000` did nothing)    |

### Badge

Props: `variant: "neutral" | "inverse" | "success" | "error" | "warning"` (default `"neutral"`), `size: "xs" | "sm" | "md" | "lg"` (default `"md"`), `class`, `children`, rest onto the `<span>`.
Every variant but `inverse` is the soft look: tone text on an 8% tint of `--surface-100`.

| daisyUI                                                                      | Component                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------- |
| `badge badge-soft`, `badge-soft badge-primary`, `badge-soft badge-secondary` | `<Badge>` (all three looked the same)       |
| `badge-soft badge-success`, `badge-error`, `badge-warning`                   | `variant="success"`, `"error"`, `"warning"` |
| `badge badge-primary`, `badge badge-secondary` (solid)                       | `variant="inverse"`                         |
| `badge-xs`, `badge-sm`, `badge-lg`                                           | `size="xs"`, `"sm"`, `"lg"`                 |
| `rounded-full`, `hover:badge-primary hover:text-primary`                     | drop, no visual effect                      |
| `payment-plans.const.ts` `badge.class: 'badge-primary' \| 'badge-secondary'` | drop the field, the modal renders `<Badge>` |

### Alert

Props: `variant: "neutral" | "error" | "warning" | "success" | "info"` (default `"neutral"`), `class`, `children`, rest onto the `<div>`.
Tinted variants use a 10% fill and a 30% border of their tone, exactly as the call sites overrode daisyUI; `warning` text is `--warning`, the others `--fg-default`.
Pass `role="alert"` or `role="status"` as the call site does today.

| daisyUI                                                                            | Component                                                 |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `alert alert-error bg-error/10 border-error/30 rounded-xl text-left text-sm`       | `<Alert variant="error">`                                 |
| `alert alert-warning bg-warning/10 border-warning/30 rounded-xl text-left text-sm` | `<Alert variant="warning">`                               |
| `rounded-lg` on an alert                                                           | keep on `class`                                           |
| `alert error-card`                                                                 | `<Alert variant="error" class="text-error">`              |
| `alert ld-card-base …` (toaster)                                                   | `<Alert class="border-hairline …">` (keep layout classes) |
| `alertClass: 'alert-info' \| …` in the toaster                                     | drop, it was never rendered                               |

### Kbd

Props: `size: "sm" | "md"` (default `"md"`), `class`, `children`, rest onto `<kbd>`.

| daisyUI                                   | Component                         |
| ----------------------------------------- | --------------------------------- |
| `kbd`                                     | `<Kbd>`                           |
| `kbd kbd-sm`, `<code class="kbd kbd-sm">` | `<Kbd size="sm">`                 |
| `hover:bg-base-200`                       | drop, it matched the resting fill |

### StatusDot

Props: `variant: "success" | "error" | "warning"` (required), `class`, rest onto the `<span>`, which is `aria-hidden` by default because it always sits next to its label.

| daisyUI                                                   | Component                   |
| --------------------------------------------------------- | --------------------------- |
| `status status-success`, `status-error`, `status-warning` | `<StatusDot variant="…" />` |

### Link (Tailwind recipe, no component)

Links are plain `<a>` elements; a component would only rename utilities.

| daisyUI             | Tailwind                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `link`              | `underline focus-visible:outline-2 focus-visible:outline-offset-2`                                                                             |
| `link link-hover`   | `hover:underline focus-visible:outline-2 focus-visible:outline-offset-2`                                                                       |
| `link link-primary` | `text-fg-default underline hover:text-[color-mix(in_oklab,var(--fg-default)_80%,#000)] focus-visible:outline-2 focus-visible:outline-offset-2` |

### Indicator (Tailwind recipe, no component)

| daisyUI                                            | Tailwind                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `indicator`                                        | `relative inline-flex w-max`                                                        |
| `indicator-item` (top end)                         | `absolute top-0 right-0 z-1 translate-x-1/2 -translate-y-1/2 whitespace-nowrap`     |
| `indicator-item indicator-bottom indicator-center` | `absolute bottom-0 left-1/2 z-1 -translate-x-1/2 translate-y-1/2 whitespace-nowrap` |

A badge as the item: `<Badge size="xs" class="absolute top-0 right-0 z-1 …">PRO</Badge>`.

### Colours that changed (actions and feedback)

- Disabled button fill, 10% over the page: `--surface-100` (neutral-800, was #272729).
- Disabled button label, 20% over that fill: `--fg-faint` (neutral-600, was #505051).
- Disabled `ghost`, `transparent` and `link` label, 20% over the page: `--border-strong` (neutral-700, was #3e3e3f); no text token sits at that step.
- Kbd border, 20% over its own fill: `--border-strong` (neutral-700, was #474749).

### Behaviour that changed

- Pills by default (above).
- A bare `btn-soft` used to darken on hover; `soft` now turns white on hover like the four `btn-secondary btn-soft` buttons (only the metric delete button in `MetricsTiles` is affected).
- Keyboard focus on `ghost`, `soft` and `outline` buttons shows the outline only; daisyUI also filled them.
