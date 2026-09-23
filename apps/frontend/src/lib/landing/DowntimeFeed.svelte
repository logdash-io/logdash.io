<script lang="ts">
  import RollingNumber from '$lib/domains/shared/ui/components/RollingNumber.svelte';
  import { flushSync } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import {
    DOWNTIME_MENTIONS,
    type DowntimeMention,
  } from './data/downtime-mentions';

  type MentionRow = DowntimeMention & {
    key: number;
    at: number;
  };

  const SERVICE = 'checkout.acme.com';
  const RENDERED_ROWS = 7;
  const SEED_OFFSETS_S = [9, 34, 71, 118, 160, 205, 248];
  const MIN_ARRIVAL_MS = 1_400;
  const MAX_ARRIVAL_MS = 2_600;
  const RUSH_ARRIVAL_MS = 120;
  const SETTLE_MS = 110;
  const BLUR_PER_MS = 8;
  const MAX_BLUR_PX = 4;
  const DOWN_FOR_AT_START_MS = 14 * 60_000 + 32_000;
  const UNANSWERED_AT_START = 23;

  const startedAt = Date.now();
  const blurId = $props.id();

  let now = $state(startedAt);
  let rows = $state<MentionRow[]>(seedRows());
  let unanswered = $state(UNANSWERED_AT_START);
  let cursor = SEED_OFFSETS_S.length;
  let root = $state<HTMLElement | null>(null);
  let list = $state<HTMLElement | null>(null);
  let blur = $state<SVGFEGaussianBlurElement | null>(null);
  let onScreen = $state(false);

  const downFor = $derived(formatClock(now - startedAt + DOWN_FOR_AT_START_MS));

  $effect(() => {
    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });

    observer.observe(root);

    return () => observer.disconnect();
  });

  $effect(() => {
    if (!onScreen || !root || !list || !blur) {
      return;
    }

    const feed = root;
    const stack = list;
    const motionBlur = blur;
    let last = performance.now();
    let progress = 0;
    let jitter = Math.random();
    let offset = 0;

    let frame = requestAnimationFrame(function onFrame(time) {
      const dt = Math.min(time - last, 64);
      const rush = rushFor(feed);

      last = time;
      now = Date.now();
      progress += dt / arrivalGap(rush, jitter);

      if (progress >= 1) {
        progress = 0;
        jitter = Math.random();
        rows = [nextRow(), ...rows.slice(0, RENDERED_ROWS - 1)];
        unanswered += 1;
        flushSync();
        offset += (stack.firstElementChild as HTMLElement).offsetHeight;
      }

      const untilNext = (1 - progress) * arrivalGap(rush, jitter);
      const settle = offset * (1 - Math.exp(-dt / SETTLE_MS));
      const cruise = offset * Math.min(1, dt / untilNext);
      const step = prefersReducedMotion.current
        ? offset
        : Math.min(offset, settle + (cruise - settle) * rush);

      offset -= step;
      stack.style.transform = offset ? `translateY(${-offset}px)` : '';

      const blurPx = Math.min(MAX_BLUR_PX, (step / dt) * BLUR_PER_MS);

      motionBlur.setAttribute('stdDeviation', `0 ${blurPx.toFixed(2)}`);
      stack.style.filter = blurPx > 0.3 ? `url(#${blurId})` : '';

      frame = requestAnimationFrame(onFrame);
    });

    return () => cancelAnimationFrame(frame);
  });

  function rushFor(element: HTMLElement): number {
    if (prefersReducedMotion.current) {
      return 0;
    }

    const rect = element.getBoundingClientRect();
    const offset = Math.abs(
      rect.top + rect.height / 2 - window.innerHeight / 2,
    );
    const distance = offset / ((window.innerHeight + rect.height) / 2);
    const t = Math.min(1, Math.max(0, (distance - 0.05) / 0.45));

    return t * t * (3 - 2 * t);
  }

  function arrivalGap(rush: number, jitter: number): number {
    const calm = MIN_ARRIVAL_MS + jitter * (MAX_ARRIVAL_MS - MIN_ARRIVAL_MS);
    const rushed = RUSH_ARRIVAL_MS * (0.75 + jitter * 0.5);

    return calm * (rushed / calm) ** rush;
  }

  function seedRows(): MentionRow[] {
    return SEED_OFFSETS_S.map((secondsAgo, index) => ({
      ...DOWNTIME_MENTIONS[index],
      key: index,
      at: startedAt - secondsAgo * 1_000,
    }));
  }

  function nextRow(): MentionRow {
    const mention = DOWNTIME_MENTIONS[cursor % DOWNTIME_MENTIONS.length];
    cursor += 1;

    return { ...mention, key: cursor, at: Date.now() };
  }

  function emphasized(
    mention: DowntimeMention,
  ): { text: string; strong: boolean }[] {
    const [before, after] = mention.text.split(mention.strong);

    return [
      { text: before, strong: false },
      { text: mention.strong, strong: true },
      { text: after, strong: false },
    ];
  }

  function ago(at: number): string {
    const seconds = Math.max(0, Math.round((now - at) / 1_000));

    if (seconds < 5) {
      return 'now';
    }

    if (seconds < 60) {
      return `${seconds}s`;
    }

    return `${Math.floor(seconds / 60)}m`;
  }

  function formatClock(ms: number): string {
    const minutes = Math.floor(ms / 60_000);
    const seconds = Math.floor(ms / 1_000) % 60;
    const millis = Math.floor(ms) % 1_000;

    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }
</script>

<div bind:this={root} class="flex h-full w-full flex-col gap-5">
  <div class="flex flex-col gap-0.5">
    <span class="text-neutral-500 text-xs">
      <RollingNumber value={unanswered} />
      unanswered pings
    </span>

    <div class="flex items-center justify-between gap-3">
      <h3 class="min-w-0 truncate text-base font-medium">{SERVICE}</h3>

      <span
        class="text-error flex shrink-0 items-center gap-2 text-sm font-medium"
      >
        <span class="bg-error size-2 rounded-full"></span>
        Down
        <span
          class="text-neutral-500 font-mono text-xs font-normal tabular-nums"
        >
          {downFor}
        </span>
      </span>
    </div>
  </div>

  <svg class="absolute size-0" aria-hidden="true">
    <filter id={blurId} x="0" y="-20%" width="100%" height="140%">
      <feGaussianBlur bind:this={blur} stdDeviation="0 0" />
    </filter>
  </svg>

  <div class="border-hairline border-t" aria-hidden="true">
    <div
      class="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_0.75rem)]"
    >
      <div bind:this={list} class="will-change-transform">
        {#each rows as mention (mention.key)}
          <div class="border-hairline flex gap-3 border-b py-3.5">
            <img
              class="bg-base-100 size-8 shrink-0 rounded-full object-cover grayscale"
              src={mention.avatar}
              alt=""
              width="32"
              height="32"
              loading="lazy"
              decoding="async"
            />

            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <div class="flex items-baseline gap-2">
                <span class="truncate text-sm font-medium">{mention.name}</span>

                <span
                  class="text-neutral-600 hidden truncate text-sm sm:inline"
                >
                  {mention.handle}
                </span>

                <span
                  class="text-neutral-600 ml-auto shrink-0 text-xs tabular-nums"
                >
                  {ago(mention.at)}
                </span>
              </div>

              <p class="text-neutral-400 text-sm text-pretty">
                {#each emphasized(mention) as part, index (index)}
                  <span
                    class={{
                      'decoration-error underline decoration-wavy decoration-1 underline-offset-4 [text-decoration-skip-ink:none]':
                        part.strong,
                    }}
                  >
                    {part.text}
                  </span>
                {/each}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
