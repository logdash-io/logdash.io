<script lang="ts">
  import FilterIcon from '$lib/domains/shared/icons/FilterIcon.svelte';
  import FakeLogs from '$lib/landing/FakeLogs.svelte';
  import { SearchIcon } from 'lucide-svelte';

  type Props = {
    /** Rows in the tail while the panel is as tall as its content. */
    rows: number;
    /** With a fixed frame height, show as many rows as fit instead. */
    fit: boolean;
  };

  type Bucket = {
    /** Bar height in px, out of the strip's 32. */
    total: number;
    /** The error share of that height, drawn on top. */
    errors: number;
  };

  const { rows, fit }: Props = $props();

  const CHIP_CLASS =
    'ring-hairline text-neutral-400 flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs ring-1 ring-inset';

  /** One tail row: a 20px line plus the feed's 8px gap. */
  const ROW_PX = 28;
  const FEED_GAP_PX = 8;
  const MIN_ROWS = 3;

  /** Log volume over the last hour, the analytics strip a logs tile has in the app. */
  const BUCKETS: Bucket[] = [
    { total: 11, errors: 0 },
    { total: 14, errors: 0 },
    { total: 10, errors: 0 },
    { total: 18, errors: 2 },
    { total: 13, errors: 0 },
    { total: 16, errors: 0 },
    { total: 21, errors: 0 },
    { total: 15, errors: 0 },
    { total: 19, errors: 3 },
    { total: 24, errors: 5 },
    { total: 17, errors: 0 },
    { total: 14, errors: 0 },
    { total: 18, errors: 0 },
    { total: 22, errors: 0 },
    { total: 27, errors: 0 },
    { total: 22, errors: 2 },
    { total: 16, errors: 0 },
    { total: 12, errors: 0 },
    { total: 15, errors: 0 },
    { total: 20, errors: 0 },
    { total: 25, errors: 6 },
    { total: 30, errors: 10 },
    { total: 23, errors: 4 },
    { total: 18, errors: 0 },
    { total: 14, errors: 0 },
    { total: 19, errors: 0 },
    { total: 22, errors: 0 },
    { total: 26, errors: 0 },
    { total: 21, errors: 0 },
    { total: 17, errors: 2 },
    { total: 14, errors: 0 },
    { total: 18, errors: 0 },
    { total: 23, errors: 0 },
    { total: 28, errors: 0 },
    { total: 24, errors: 0 },
    { total: 29, errors: 0 },
  ];

  let listHeight = $state(0);

  const fitted = $derived(
    Math.max(MIN_ROWS, Math.floor((listHeight + FEED_GAP_PX) / ROW_PX)),
  );
  const visible = $derived(fit && listHeight > 0 ? fitted : rows);
</script>

<div class="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 pb-4 lg:pb-0">
  <div class="hidden h-8 items-end gap-[3px] xl:flex" aria-hidden="true">
    {#each BUCKETS as bucket, index (index)}
      <div
        class="flex min-w-0 flex-1 flex-col justify-end gap-px"
        style:height="{bucket.total}px"
      >
        {#if bucket.errors}
          <div
            class="w-full shrink-0 rounded-[1px] bg-[#e7000b]/70"
            style:height="{bucket.errors}px"
          ></div>
        {/if}

        <div class="bg-neutral-700 w-full flex-1 rounded-[1px]"></div>
      </div>
    {/each}
  </div>

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
    <FakeLogs padded={false} header={false} {visible} />
  </div>
</div>
