<script lang="ts">
  import LogRow from '$lib/landing/LogRow.svelte';
  import { FAKE_LOG_POOL, type FakeLogTemplate } from './data/logs.mock';
  import { scheduleJittered } from './live-feed';
  import RollingFeed from './RollingFeed.svelte';

  type Props = {
    padded?: boolean;
    /** The eyebrow and title above the tail. Off where the panel around it names the tail. */
    header?: boolean;
    visible?: number;
  };

  type TailRow = FakeLogTemplate & {
    key: number;
    at: number;
  };

  const DEFAULT_VISIBLE_ROWS = 6;

  const {
    padded = true,
    header = true,
    visible = DEFAULT_VISIBLE_ROWS,
  }: Props = $props();

  /** Enough history for the widest window a caller asks for, plus the row rolling out. */
  const KEPT_ROWS = 14;
  const SEED_OFFSETS_S = [2, 6, 13, 21, 28, 34, 41, 47, 55, 62, 70, 76, 83, 91];
  const MIN_ARRIVAL_MS = 1_400;
  const MAX_ARRIVAL_MS = 3_200;
  const BURST = { chance: 0.35, minMs: 240, maxMs: 520 };

  let rows = $state<TailRow[]>(seedRows());
  let cursor = SEED_OFFSETS_S.length;

  $effect(() =>
    scheduleJittered(
      () => {
        rows = [nextRow(), ...rows.slice(0, KEPT_ROWS - 1)];
      },
      MIN_ARRIVAL_MS,
      MAX_ARRIVAL_MS,
      BURST,
    ),
  );

  function seedRows(): TailRow[] {
    const now = Date.now();

    return SEED_OFFSETS_S.map((secondsAgo, index) => ({
      ...FAKE_LOG_POOL[index],
      key: index,
      at: now - secondsAgo * 1_000,
    }));
  }

  function nextRow(): TailRow {
    const template = FAKE_LOG_POOL[cursor % FAKE_LOG_POOL.length];
    cursor += 1;

    return { ...template, key: cursor, at: Date.now() };
  }
</script>

<div
  class={[
    'flex h-full w-full flex-col gap-4',
    { 'min-h-64': header, 'px-4 py-5 sm:py-6': padded },
  ]}
>
  {#if header}
    <div class="flex flex-col gap-0.5">
      <span class="text-neutral-500 text-xs">Live tail</span>
      <h3 class="text-base font-medium">Recent logs</h3>
    </div>
  {/if}

  <RollingFeed items={rows} {visible}>
    {#snippet row(log)}
      <LogRow
        prefix="short"
        date={new Date(log.at)}
        level={log.level}
        message={log.message}
      />
    {/snippet}
  </RollingFeed>
</div>
