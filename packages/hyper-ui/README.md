# @logdash/hyper-ui

LogDash's design system components and utilities built for Svelte 5 with DaisyUI and Tailwind CSS.

## Installation

```bash
pnpm add @logdash/hyper-ui
```

## Usage

```svelte
<script>
  import { Button } from '@logdash/hyper-ui';
</script>

<Button variant="primary" size="md" on:click={() => console.log('clicked')}>
  Click me
</Button>

<Button variant="secondary" size="lg" loading>
  Loading...
</Button>
```

## Development

```bash
# Build the package
pnpm build

# Watch for changes during development
pnpm dev

# Type check
pnpm check

# Clean build artifacts
pnpm clean
```

## Components

This design system includes:

- **Button** - DaisyUI button component with various variants and sizes
  - Variants: `primary`, `secondary`, `accent`, `neutral`, `ghost`, `outline`
  - Sizes: `xs`, `sm`, `md`, `lg`
  - Props: `disabled`, `loading`, `type`

More components will be added as needed.

## Styling

This package uses DaisyUI classes and assumes your project has Tailwind CSS and DaisyUI configured. Components are designed to work seamlessly with your existing DaisyUI theme.

## Contributing

When adding new components:

1. Create the component in `src/components/ComponentName/`
2. Add `ComponentName.svelte` and `ComponentName.types.ts`
3. Create an `index.ts` file to export the component
4. Export it from `src/components/index.ts`
5. Update this README

## License

MIT
