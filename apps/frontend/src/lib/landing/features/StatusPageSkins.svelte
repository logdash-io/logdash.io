<script lang="ts">
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { generateDemoStatusPage } from '$lib/domains/app/projects/domain/status-page-demo-data';
  import ChevronLeftIcon from '$lib/domains/shared/icons/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import ReactIcon from '$lib/domains/shared/icons/ReactIcon.svelte';
  import SvelteKitIcon from '$lib/domains/shared/icons/SvelteKitIcon.svelte';
  import CodeBlock from '$lib/landing/guides/blocks/CodeBlock.svelte';
  import LandingHeading from '$lib/landing/LandingHeading.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';
  import StageLight from '$lib/landing/stage/StageLight.svelte';
  import type { Monitor } from '@logdash/status';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { onMount, type Component } from 'svelte';
  import type { FeaturePageData } from './feature-page';
  import ArcadeSkin from './skins/ArcadeSkin.svelte';
  import BananasSkin from './skins/BananasSkin.svelte';
  import Desktop95Skin from './skins/Desktop95Skin.svelte';
  import LensPage from './skins/LensPage.svelte';
  import ReceiptSkin from './skins/ReceiptSkin.svelte';
  import {
    setLensHover,
    type LensHover,
    type SkinProps,
  } from './skins/skin-data';
  import StonksSkin from './skins/StonksSkin.svelte';

  type Props = {
    copy: NonNullable<FeaturePageData['statusPages']>;
  };

  type Lens = {
    id: string;
    name: string;
    tagline: string;
    accent: string;
    ink: string;
    component: Component<SkinProps>;
  };

  const { copy }: Props = $props();

  const LENSES: Lens[] = [
    {
      id: 'bananas',
      name: 'Bananas',
      tagline: 'Uptime, measured in potassium.',
      accent: '#ffe45c',
      ink: '#3d2800',
      component: BananasSkin,
    },
    {
      id: 'receipt',
      name: 'Receipt',
      tagline: 'Itemised uptime. Keep it for your records.',
      accent: '#d4162c',
      ink: '#ffffff',
      component: ReceiptSkin,
    },
    {
      id: '95',
      name: '95',
      tagline: 'It is now safe to turn off your pager.',
      accent: '#008080',
      ink: '#ffffff',
      component: Desktop95Skin,
    },
    {
      id: 'arcade',
      name: 'Arcade',
      tagline: 'Every failed check costs a heart.',
      accent: '#ff2e4d',
      ink: '#140e3c',
      component: ArcadeSkin,
    },
    {
      id: 'stonks',
      name: 'Stonks',
      tagline: 'Uptime only goes up. Not financial advice.',
      accent: '#00d26a',
      ink: '#000000',
      component: StonksSkin,
    },
  ];

  const INSTALL = [
    {
      title: 'React',
      icon: ReactIcon,
      code: 'npx shadcn add https://logdash.io/r/react/status-page.json',
    },
    {
      title: 'Svelte',
      icon: SvelteKitIcon,
      code: 'npx shadcn-svelte add https://logdash.io/r/svelte/status-page.json',
    },
  ];

  const SWIPE_DISTANCE = 40;

  const generated = generateDemoStatusPage();
  const demo = {
    ...generated,
    monitors: [...generated.monitors].sort(byUptime),
  };

  const hover = $state<LensHover>({ monitor: null, day: null });

  setLensHover(hover);

  let step = $state(0);
  let animated = $state(false);
  let swipeFrom: number | null = null;

  const active = $derived(lensAt(step));
  const lens = $derived(LENSES[active]);

  onMount(() => {
    const id = page.url.searchParams.get('skin');
    const index = LENSES.findIndex((option) => option.id === id);

    if (index > 0) step = index;

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        animated = true;
      }),
    );
  });

  function onPrevious(): void {
    go(step - 1);
  }

  function onNext(): void {
    go(step + 1);
  }

  function onDot(index: number): void {
    const half = Math.floor(LENSES.length / 2);

    go(step + lensAt(index - active + half) - half);
  }

  function onPointerDown(event: PointerEvent): void {
    swipeFrom = event.clientX;
  }

  function onPointerUp(event: PointerEvent): void {
    if (swipeFrom === null) return;

    const distance = event.clientX - swipeFrom;
    swipeFrom = null;

    if (Math.abs(distance) < SWIPE_DISTANCE) return;

    go(step + (distance < 0 ? 1 : -1));
  }

  function onPointerCancel(): void {
    swipeFrom = null;
  }

  function go(target: number): void {
    if (target === step) return;

    step = target;
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    replaceState(`?skin=${LENSES[lensAt(step)].id}#status-pages`, page.state);
  }

  function lensAt(position: number): number {
    return ((position % LENSES.length) + LENSES.length) % LENSES.length;
  }

  function byUptime(a: Monitor, b: Monitor): number {
    return (a.uptime['90d'] ?? 100) - (b.uptime['90d'] ?? 100);
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
    class="@container relative overflow-hidden px-4 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 lg:px-10"
  >
    <StageLight preset="bottom" class="absolute inset-0" />

    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Status page lenses"
      class={['lens-wrap relative mx-auto', { animated }]}
      style:--pos={step}
      style:--count={LENSES.length}
    >
      <div
        class="lens-stage relative touch-pan-y select-none"
        onpointerdown={onPointerDown}
        onpointerup={onPointerUp}
        onpointercancel={onPointerCancel}
      >
        <div
          class="page-card ring-hairline absolute overflow-hidden rounded-xl shadow-[0_24px_48px_-16px_rgba(0,0,0,0.7)] ring-1"
        >
          <LensPage page={demo} />

          {#each LENSES as option, index (option.id)}
            <div
              aria-hidden="true"
              inert
              class="lens-layer absolute inset-0"
              style:--i={index}
            >
              <option.component page={demo} />
            </div>
          {/each}
        </div>

        {#each LENSES as option, index (option.id)}
          <div
            aria-hidden="true"
            class="lens-frame absolute"
            style:--i={index}
            style:--accent={option.accent}
            style:--ink={option.ink}
          >
            <span
              class="lens-tab absolute flex h-7 items-center gap-2 px-2.5 text-xs whitespace-nowrap"
            >
              <span class="font-semibold">{option.name}</span>
              <span class="max-sm:hidden">{option.tagline}</span>
            </span>
          </div>
        {/each}
      </div>

      <p aria-live="polite" class="sr-only">
        {lens.name} lens. {lens.tagline}
      </p>

      <div class="mt-8 flex items-center justify-center gap-4">
        {@render arrow(
          'Previous lens',
          onPrevious,
          ChevronLeftIcon,
          'arrow-previous',
        )}

        <div class="flex">
          {#each LENSES as option, index (option.id)}
            <button
              type="button"
              aria-label="Show the {option.name} lens"
              aria-current={index === active}
              class="group flex h-8 items-center px-1.5 focus-visible:outline-2 focus-visible:outline-offset-0"
              onclick={() => onDot(index)}
            >
              <span
                class="dot h-2 rounded-full [--rest:var(--color-neutral-700)] group-hover:[--rest:var(--color-neutral-500)]"
                style:--i={index}
                style:--accent={option.accent}
              ></span>
            </button>
          {/each}
        </div>

        {@render arrow('Next lens', onNext, ChevronRightIcon, 'arrow-next')}
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
      class="border-hairline border-t px-4 py-10 sm:px-6 lg:px-10 lg:py-12 xl:col-span-7 xl:border-t-0"
    >
      <div class="flex flex-col gap-4">
        {#each INSTALL as command (command.title)}
          <div class="bg-surface-elevated rounded-xl">
            <CodeBlock
              code={command.code}
              language="bash"
              title={command.title}
              icon={command.icon}
            />
          </div>
        {/each}
      </div>
    </div>
  </div>
</LandingSection>

{#snippet arrow(
  label: string,
  onclick: () => void,
  Icon: typeof ChevronLeftIcon,
  position: string,
)}
  <button
    type="button"
    aria-label={label}
    class={[
      'arrow bg-surface-inverse text-surface-root hover:bg-surface-inverse-hover flex size-12 shrink-0 items-center justify-center rounded-full shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)] transition-[scale] duration-100 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-90 lg:size-14',
      position,
    ]}
    {onclick}
  >
    <Icon class="size-5 lg:size-6" />
  </button>
{/snippet}

<style>
  @property --pos {
    syntax: '<number>';
    inherits: true;
    initial-value: 0;
  }

  .lens-wrap {
    --pad: 1rem;
    --exit: 3rem;
    --page-h: 35rem;
  }

  @media (width >= 40rem) {
    .lens-wrap {
      --pad: 2rem;
      --page-h: 30rem;
    }
  }

  @media (width >= 64rem) {
    .lens-wrap {
      --pad: 2.5rem;
      width: min(55rem, 100% - 11rem);
    }

    .arrow {
      position: absolute;
      top: calc(var(--pad) + var(--page-h) / 2);
      translate: 0 -50%;
    }

    .arrow-previous {
      right: calc(100% + 1.75rem);
    }

    .arrow-next {
      left: calc(100% + 1.75rem);
    }
  }

  .lens-stage {
    height: calc(var(--page-h) + 2 * var(--pad));
  }

  .lens-wrap.animated {
    transition: --pos 520ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .lens-wrap.animated {
      transition: none;
    }
  }

  .page-card {
    inset: var(--pad);
  }

  .lens-layer,
  .lens-frame,
  .dot {
    --offset: calc(
      mod(var(--i) - var(--pos) + var(--count) / 2, var(--count)) -
        var(--count) / 2
    );
  }

  .lens-layer {
    --x: calc(
      var(--offset) * (50cqw + 50% + var(--pad) + var(--exit)) - var(--pad)
    );
    clip-path: inset(
      calc(-1 * var(--pad)) calc(-1 * var(--x) - 2 * var(--pad))
        calc(-1 * var(--pad)) var(--x)
    );
  }

  .lens-frame {
    top: 0;
    bottom: 0;
    left: calc(var(--offset) * (50cqw + 50% + var(--exit)));
    width: 100%;
    pointer-events: none;
    box-shadow:
      0 0 0 1px #000,
      0 0 0 5px var(--accent),
      0 0 0 6px #000;
  }

  /* The pill stretches between dots in step with the sliding lens. */
  .dot {
    --near: max(0, 1 - max(var(--offset), -1 * var(--offset)));
    width: calc(0.5rem + 1rem * var(--near));
    background: color-mix(
      in oklab,
      var(--accent) calc(var(--near) * 100%),
      var(--rest)
    );
  }

  .lens-tab {
    /* The tab's 1px border lands on the frame's outer black ring on both edges. */
    bottom: calc(100% + 6px);
    left: -5px;
    background: var(--accent);
    color: var(--ink);
    box-shadow: 0 0 0 1px #000;
  }
</style>
