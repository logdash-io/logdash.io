<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import FilterIcon from '$lib/domains/shared/icons/FilterIcon.svelte';
  import LogRow from '$lib/landing/LogRow.svelte';
  import RollingFeed from '$lib/landing/RollingFeed.svelte';
  import { SearchIcon } from 'lucide-svelte';
  import { showsVisitorAccount } from './hero-showcase';

  type Props = {
    /** Rows in the tail while the panel is as tall as its content. */
    rows: number;
    /** With a fixed frame height, show as many rows as fit instead. */
    fit: boolean;
  };

  type TailRow = {
    key: number;
    at: Date;
    level: string;
    message: string;
  };

  const { rows, fit }: Props = $props();

  const CHIP_CLASS =
    'ring-hairline text-neutral-400 flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs ring-1 ring-inset';

  /** One tail row: a 20px line plus the feed's 8px gap. */
  const ROW_PX = 28;
  const FEED_GAP_PX = 8;
  const MIN_ROWS = 3;

  let listHeight = $state(0);

  const fitted = $derived(
    Math.max(MIN_ROWS, Math.floor((listHeight + FEED_GAP_PX) / ROW_PX)),
  );
  const visible = $derived(fit && listHeight > 0 ? fitted : rows);

  const visitorAccount = $derived(
    showsVisitorAccount(anonymousPreviewState.phase),
  );
  const logs = $derived(anonymousPreviewState.demo.logs);

  /**
   * RollingFeed keys rows by number. The low 48 bits of a log's ObjectId (its
   * random part and counter) stay the same across polls and fit a safe integer.
   */
  const tail = $derived<TailRow[]>(
    (logs ?? []).map((log) => ({
      key: parseInt(log.id.slice(-12), 16),
      at: new Date(log.createdAt),
      level: log.level,
      message: log.message,
    })),
  );
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4 px-4 pt-4 pb-4 lg:pb-0">
  <div class="flex items-center gap-2" aria-hidden="true">
    <div
      class="ring-hairline bg-neutral-950 text-neutral-600 flex h-8 min-w-24 flex-1 items-center gap-2 rounded-lg px-2.5 text-sm ring-1 ring-inset"
    >
      <SearchIcon class="size-3.5 shrink-0" />
      <span class="truncate">Search logs</span>
    </div>

    <span class={CHIP_CLASS}>
      <FilterIcon class="size-3.5 shrink-0" />
      Filter
    </span>

    <span class={CHIP_CLASS}>
      <span class="size-1.5 rounded-full bg-[#e7000b]"></span>
      Errors
    </span>

    <span class={[CHIP_CLASS, 'max-sm:hidden']}>
      <span class="size-1.5 rounded-full bg-[#fe9a00]"></span>
      Warnings
    </span>
  </div>

  <div class="min-h-0 flex-1 overflow-hidden" bind:clientHeight={listHeight}>
    {#if visitorAccount}
      <div class="flex flex-col gap-1 py-2">
        <span class="text-sm">No logs yet</span>
        <span class="text-neutral-500 text-sm">
          Your app's logs land here once you add the SDK.
        </span>
      </div>
    {:else if logs}
      <RollingFeed items={tail} {visible}>
        {#snippet row(log)}
          <LogRow
            prefix="short"
            date={log.at}
            level={log.level}
            message={log.message}
          />
        {/snippet}
      </RollingFeed>
    {:else}
      <div class="flex flex-col gap-2" aria-hidden="true">
        {#each [...Array(visible).keys()] as index (index)}
          <div class="bg-neutral-800 h-5 animate-pulse rounded"></div>
        {/each}
      </div>
    {/if}
  </div>
</div>
