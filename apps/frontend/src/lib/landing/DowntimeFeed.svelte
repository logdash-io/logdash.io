<script lang="ts">
  import RollingNumber from '$lib/domains/shared/ui/components/RollingNumber.svelte';
  import {
    DOWNTIME_MENTIONS,
    type DowntimeMention,
  } from './data/downtime-mentions';
  import { scheduleJittered } from './live-feed';
  import RollingFeed from './RollingFeed.svelte';

  type MentionRow = DowntimeMention & {
    key: number;
    at: number;
  };

  const SERVICE = 'checkout.acme.com';
  const VISIBLE_ROWS = 5;
  const SEED_OFFSETS_S = [9, 34, 71, 118, 160, 205];
  const MIN_ARRIVAL_MS = 2_400;
  const MAX_ARRIVAL_MS = 4_800;
  const DOWN_FOR_AT_START_MS = 14 * 60_000 + 32_000;
  const UNANSWERED_AT_START = 23;

  const startedAt = Date.now();

  let now = $state(startedAt);
  let rows = $state<MentionRow[]>(seedRows());
  let unanswered = $state(UNANSWERED_AT_START);
  let cursor = SEED_OFFSETS_S.length;

  const downFor = $derived(formatClock(now - startedAt + DOWN_FOR_AT_START_MS));

  $effect(() => {
    const clock = window.setInterval(() => {
      now = Date.now();
    }, 1_000);

    const stopArrivals = scheduleJittered(
      () => {
        rows = [nextRow(), ...rows.slice(0, VISIBLE_ROWS)];
        unanswered += 1;
      },
      MIN_ARRIVAL_MS,
      MAX_ARRIVAL_MS,
    );

    return () => {
      window.clearInterval(clock);
      stopArrivals();
    };
  });

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
    const totalSeconds = Math.floor(ms / 1_000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('');
  }
</script>

<div class="flex h-full w-full flex-col gap-5">
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

  <RollingFeed items={rows} visible={VISIBLE_ROWS} gap={0}>
    {#snippet row(mention)}
      <div class="border-hairline flex gap-3 border-t py-3.5">
        <span
          class="bg-base-100 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-neutral-300"
        >
          {initials(mention.name)}
        </span>

        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <div class="flex items-baseline gap-2">
            <span class="truncate text-sm font-medium">{mention.name}</span>

            <span class="text-neutral-600 hidden truncate text-sm sm:inline">
              {mention.handle}
            </span>

            <span
              class="text-neutral-600 ml-auto shrink-0 text-xs tabular-nums"
            >
              {ago(mention.at)}
            </span>
          </div>

          <p class="text-neutral-400 text-sm text-pretty">{mention.text}</p>
        </div>
      </div>
    {/snippet}
  </RollingFeed>
</div>
