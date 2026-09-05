<script lang="ts">
  import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-svelte';
  import { flushSync } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import LandingSection from './LandingSection.svelte';

  type Direction = 1 | -1;

  const TRUSTED_BY = [
    { text: 'Trusted by ', strong: false },
    { text: 'founders', strong: true },
    { text: ', ', strong: false },
    { text: 'solo devs', strong: true },
    { text: ', and ', strong: false },
    { text: 'small teams', strong: true },
    { text: ' shipping without interruptions.', strong: false },
  ];

  const REVIEWS = [
    {
      quote:
        'Most tools feel like they were made for enterprises. Logdash feels like it was made for me.',
      person: 'Bartosz Świtalski',
      company: {
        who: 'Co-Founder',
        name: 'Cryptly',
        url: 'https://cryptly.dev?ref=logdash.io',
      },
      img: '/images/testimonials/bsw.webp',
    },
    {
      quote:
        'I don’t have time for complex dashboards. I just want to know what went wrong and fix it fast. Logdash nailed that.',
      person: 'Yaroslaw Korshak',
      company: {
        who: 'CEO',
        name: 'Resurgo.ai',
        url: 'https://resurgo.ai?ref=logdash.io',
      },
      img: '/images/testimonials/yaroslaw.png',
    },
    {
      quote:
        'I’m the only dev on my app. When something breaks, it’s on me. Logdash gives me answers before I even ask the question.',
      person: 'Jerzy Wiśniewski',
      company: {
        who: 'Co-Founder',
        name: 'BlueMenu',
        url: 'https://bluemenu.io/?ref=logdash.io',
      },
      img: '/images/testimonials/bialyjurek.webp',
    },
  ];

  /** A quote holds this long before the next one rolls in on its own. */
  const AUTOPLAY_MS = 8_000;
  /** How far a quote travels while it fades in or out. */
  const SLIDE_PX = 24;
  const ENTER_MS = 400;
  const LEAVE_MS = 240;

  let active = $state(0);
  /** Which way the deck moves: quotes enter from this side and leave on the other. */
  let direction = $state<Direction>(1);
  /** The quote on its way out, parked on the far side until the next move. */
  let leaving = $state<number | null>(null);
  let root = $state<HTMLElement | null>(null);
  let inView = $state(false);
  let engaged = $state(false);
  let pageVisible = $state(true);
  let manual = $state(false);

  /** Rolls on its own only while nobody is reading closely or has taken the wheel. */
  const autoplay = $derived(
    !manual &&
      !engaged &&
      inView &&
      pageVisible &&
      !prefersReducedMotion.current,
  );

  function go(step: Direction): void {
    if (step !== direction) {
      // Park every hidden quote on the side the new direction enters from, and
      // let the browser see it there, before the swap starts a transition.
      flushSync(() => {
        direction = step;
        leaving = null;
      });
      root?.getBoundingClientRect();
    }

    leaving = active;
    active = (active + step + REVIEWS.length) % REVIEWS.length;
  }

  function onArrow(step: Direction): void {
    manual = true;
    go(step);
  }

  function offsetOf(index: number): number {
    if (index === active) return 0;
    if (index === leaving) return -SLIDE_PX * direction;
    return SLIDE_PX * direction;
  }

  function durationOf(index: number): number {
    if (prefersReducedMotion.current) return 0;
    if (index === active) return ENTER_MS;
    if (index === leaving) return LEAVE_MS;
    return 0;
  }

  $effect(() => {
    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.5 },
    );

    observer.observe(root);

    return () => observer.disconnect();
  });

  $effect(() => {
    if (!autoplay) {
      return;
    }

    const interval = setInterval(() => go(1), AUTOPLAY_MS);

    return () => clearInterval(interval);
  });
</script>

<svelte:document onvisibilitychange={() => (pageVisible = !document.hidden)} />

<LandingSection id="testimonials">
  <div
    class="flex flex-col gap-8 px-4 py-16 sm:px-6 lg:gap-12 lg:px-10 lg:py-20"
  >
    <h2 class="text-neutral-500 text-center text-base font-medium text-balance">
      {#each TRUSTED_BY as part (part.text)}
        {#if part.strong}
          <span class="text-base-content">{part.text}</span>
        {:else}
          {part.text}
        {/if}
      {/each}
    </h2>

    <!--
      One quote at a time, straight on the page. Every quote stays in the DOM,
      stacked in the same grid cell, so the block keeps the height of the
      longest one and the page never jumps when the deck moves. The controls
      sit in the bottom right corner from sm, level with the author row.
    -->
    <div
      bind:this={root}
      class="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label="What founders say about Logdash"
      onpointerenter={() => (engaged = true)}
      onpointerleave={() => (engaged = false)}
      onfocusin={() => (engaged = true)}
      onfocusout={() => (engaged = false)}
    >
      <div class="grid">
        {#each REVIEWS as review, index (review.person)}
          {@const current = index === active}
          <figure
            class={[
              'col-start-1 row-start-1 flex flex-col gap-8 transition-[opacity,translate] ease-[cubic-bezier(0.22,1,0.36,1)] sm:pr-44 lg:gap-10',
              { 'pointer-events-none opacity-0': !current },
            ]}
            style:translate="{offsetOf(index)}px 0"
            style:transition-duration="{durationOf(index)}ms"
            aria-hidden={!current}
            inert={!current}
          >
            <blockquote
              class="max-w-3xl text-2xl font-medium tracking-[-0.02em] text-balance sm:text-3xl"
            >
              “{review.quote}”
            </blockquote>

            <!-- Anchored to the cell floor so every author row lines up with the arrows. -->
            <figcaption class="mt-auto flex items-center gap-3">
              <img
                class="ring-base-100 size-10 shrink-0 rounded-full object-cover grayscale ring-1"
                src={review.img}
                alt=""
                loading="lazy"
              />

              <div class="flex flex-col">
                <span class="text-sm font-medium">{review.person}</span>

                <span class="text-neutral-500 text-sm">
                  {review.company.who} at
                  <!-- eslint-disable svelte/no-navigation-without-resolve -->
                  <a
                    class="hover:text-base-content transition-ink duration-150"
                    target="_blank"
                    rel="noopener"
                    href={review.company.url}
                  >
                    {review.company.name}
                  </a>
                  <!-- eslint-enable svelte/no-navigation-without-resolve -->
                </span>
              </div>
            </figcaption>
          </figure>
        {/each}
      </div>

      <div
        class="mt-8 flex items-center gap-3 sm:absolute sm:right-0 sm:bottom-0 sm:mt-0"
      >
        <span
          class="text-neutral-600 mr-1 font-mono text-xs tabular-nums"
          aria-live="polite"
        >
          {active + 1} / {REVIEWS.length}
        </span>

        <button
          type="button"
          class="btn btn-subtle btn-circle"
          aria-label="Previous quote"
          data-posthog-id="testimonials-previous"
          onclick={() => onArrow(-1)}
        >
          <ChevronLeftIcon class="size-4" />
        </button>

        <button
          type="button"
          class="btn btn-subtle btn-circle"
          aria-label="Next quote"
          data-posthog-id="testimonials-next"
          onclick={() => onArrow(1)}
        >
          <ChevronRightIcon class="size-4" />
        </button>
      </div>
    </div>
  </div>
</LandingSection>
