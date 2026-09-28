<script lang="ts">
  import { resolve } from '$app/paths';
  import { generateDemoStatusPage } from '$lib/domains/app/projects/domain/status-page-demo-data';
  import CodeBlock from '$lib/landing/guides/blocks/CodeBlock.svelte';
  import LandingHeading from '$lib/landing/LandingHeading.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';
  import StageLight from '$lib/landing/stage/StageLight.svelte';
  import { statusPageView } from '@logdash/status/registry/svelte';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { tick } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import type { FeaturePageData } from './feature-page';

  type Props = {
    copy: NonNullable<FeaturePageData['statusPages']>;
  };

  type Skin = {
    name: string;
    colors: {
      background: string;
      foreground: string;
      muted: string;
      'muted-foreground': string;
      popover: string;
      'popover-foreground': string;
      border: string;
      ring: string;
    };
    radius: string;
    font: string;
    mono?: string;
  };

  const { copy }: Props = $props();

  const SERIF =
    "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

  const SKINS: Skin[] = [
    {
      name: 'Logdash',
      colors: {
        background: '#101012',
        foreground: '#f4f4f4',
        muted: '#1c1c1e',
        'muted-foreground': '#7f7f86',
        popover: '#1c1c1e',
        'popover-foreground': '#f4f4f4',
        border: '#222225',
        ring: '#9d9da3',
      },
      radius: '0.75rem',
      font: 'var(--font-sans)',
    },
    {
      name: 'Minimal',
      colors: {
        background: '#ffffff',
        foreground: '#0a0a0b',
        muted: '#f4f4f5',
        'muted-foreground': '#71717a',
        popover: '#ffffff',
        'popover-foreground': '#0a0a0b',
        border: '#e4e4e7',
        ring: '#a1a1aa',
      },
      radius: '0.5rem',
      font: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    },
    {
      name: 'Editorial',
      colors: {
        background: '#f6f2ea',
        foreground: '#1f1a14',
        muted: '#ebe4d6',
        'muted-foreground': '#7d7263',
        popover: '#fffcf6',
        'popover-foreground': '#1f1a14',
        border: '#e0d7c6',
        ring: '#7d7263',
      },
      radius: '0.125rem',
      font: SERIF,
      mono: SERIF,
    },
    {
      name: 'Terminal',
      colors: {
        background: '#0c0f0c',
        foreground: '#d3e0cf',
        muted: '#161b16',
        'muted-foreground': '#72816f',
        popover: '#121712',
        'popover-foreground': '#d3e0cf',
        border: '#1f271f',
        ring: '#72816f',
      },
      radius: '0rem',
      font: 'var(--font-mono)',
    },
    {
      name: 'Bold',
      colors: {
        background: '#2436d9',
        foreground: '#ffffff',
        muted: '#3446e0',
        'muted-foreground': '#c5ccff',
        popover: '#ffffff',
        'popover-foreground': '#10194d',
        border: '#4556e6',
        ring: '#ffffff',
      },
      radius: '1rem',
      font: "'Avenir Next', Avenir, 'Segoe UI', 'Helvetica Neue', sans-serif",
      mono: "'Avenir Next', Avenir, 'Segoe UI', 'Helvetica Neue', sans-serif",
    },
  ];

  const INSTALL = [
    {
      title: 'React',
      code: 'npx shadcn add https://logdash.io/r/react/status-page.json',
    },
    {
      title: 'Svelte',
      code: 'npx shadcn-svelte add https://logdash.io/r/svelte/status-page.json',
    },
  ];

  const demo = generateDemoStatusPage();

  let selected = $state(0);

  const skin = $derived(SKINS[selected]);

  function onSelect(index: number): void {
    if (index === selected) return;

    if (prefersReducedMotion.current || !document.startViewTransition) {
      selected = index;
      return;
    }

    document.startViewTransition(async () => {
      selected = index;
      await tick();
    });
  }

  function onSkinKeydown(
    event: KeyboardEvent & { currentTarget: HTMLElement },
  ): void {
    const radios = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'),
    );
    const from = radios.indexOf(event.target as HTMLElement);
    const target = {
      ArrowRight: from + 1,
      ArrowDown: from + 1,
      ArrowLeft: from - 1,
      ArrowUp: from - 1,
      Home: 0,
      End: radios.length - 1,
    }[event.key];

    if (target === undefined) return;

    event.preventDefault();
    const next = (target + radios.length) % radios.length;
    radios[next].focus();
    onSelect(next);
  }

  function skinStyle({ colors, radius, font, mono }: Skin): string {
    return [
      ...Object.entries(colors).map(([name, value]) => `--${name}: ${value}`),
      `--radius: ${radius}`,
      '--radius-sm: max(0px, calc(var(--radius) - 4px))',
      '--radius-md: max(0px, calc(var(--radius) - 2px))',
      `font-family: ${font}`,
      mono ? `--font-mono: ${mono}` : '',
    ].join('; ');
  }
</script>

<LandingHeading
  id="status-pages"
  title={copy.title}
  quiet={copy.quiet}
  description={copy.description}
/>

<LandingSection>
  <div
    data-nosnippet
    class="relative overflow-hidden px-4 pt-10 sm:px-6 sm:pt-14 lg:px-10"
  >
    <StageLight preset="bottom" class="absolute inset-0" />

    <div class="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
      <div
        role="radiogroup"
        aria-label="Status page theme"
        tabindex="-1"
        class="ring-hairline bg-surface-root flex w-full rounded-full p-1 ring-1 sm:inline-flex sm:w-auto"
        onkeydown={onSkinKeydown}
      >
        {#each SKINS as option, index (option.name)}
          <button
            type="button"
            role="radio"
            aria-checked={index === selected}
            tabindex={index === selected ? 0 : -1}
            class={[
              'flex h-8 flex-auto items-center justify-center rounded-full px-2 text-[13px] font-medium transition-ink duration-150 focus-visible:outline-2 focus-visible:outline-offset-0 sm:flex-none sm:px-3.5 sm:text-sm',
              index === selected
                ? 'bg-neutral-800 text-fg-default'
                : 'text-neutral-400 hover:text-fg-default',
            ]}
            onclick={() => onSelect(index)}
          >
            {option.name}
          </button>
        {/each}
      </div>

      <div
        class="ring-hairline bg-surface-elevated w-full overflow-hidden rounded-t-xl shadow-[0_32px_64px_-24px_rgba(0,0,0,0.7)] ring-1"
      >
        <div
          class="border-hairline text-neutral-500 flex h-11 items-center border-b px-4 text-sm"
        >
          status.acme.com
        </div>

        <div
          class="skin bg-background text-foreground px-5 pt-8 pb-4 sm:px-10 sm:pt-10 sm:pb-6"
          style={skinStyle(skin)}
        >
          <!-- eslint-disable-next-line @typescript-eslint/no-unsafe-call -- snippets exported from a .svelte module are typed by svelte-check only -->
          {@render statusPageView(demo)}
        </div>
      </div>
    </div>
  </div>
</LandingSection>

<LandingSection>
  <div class="grid grid-cols-1 xl:grid-cols-12">
    <div
      class="border-hairline flex flex-col px-4 py-10 sm:px-6 lg:px-10 lg:py-12 xl:col-span-5 xl:border-r"
    >
      <h2 class="text-2xl font-medium tracking-[-0.02em]">
        {copy.install.title}
      </h2>

      <p class="text-neutral-400 mt-3 max-w-md leading-relaxed text-pretty">
        {copy.install.body}
      </p>

      <a
        href={resolve('/docs/status-pages')}
        class="text-fg-default hover:text-neutral-400 mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-ink duration-150"
        data-posthog-id="feature-monitoring-status-page-docs"
      >
        Read the status page docs
        <ArrowRightIcon class="size-4" />
      </a>
    </div>

    <div
      class="border-hairline relative overflow-hidden border-t px-4 py-10 sm:px-6 lg:px-10 lg:py-12 xl:col-span-7 xl:border-t-0"
    >
      <StageLight preset="bottom-left" class="absolute inset-0" />

      <div class="relative flex flex-col gap-4">
        {#each INSTALL as command (command.title)}
          <div class="bg-surface-elevated rounded-xl">
            <CodeBlock
              code={command.code}
              language="bash"
              title={command.title}
            />
          </div>
        {/each}
      </div>
    </div>
  </div>
</LandingSection>

<style>
  .skin {
    view-transition-name: status-skin;
  }

  :global(::view-transition-group(status-skin)) {
    animation-duration: 220ms;
  }
</style>
