<script lang="ts">
  import { LOG_LEVELS_MAP } from '$lib/domains/logs/domain/log-level-metadata.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level.js';
  import LogRowTime from './LogRowTime.svelte';

  type Props = {
    date: Date;
    level: LogLevel;
    message: string;
    namespace?: string;
    isSelected?: boolean;
    onclick?: () => void;
  };

  const {
    date: rawDate,
    level,
    message,
    namespace,
    isSelected = false,
    onclick,
  }: Props = $props();

  const dotColor = $derived(LOG_LEVELS_MAP[level].color);
</script>

<button
  type="button"
  class={[
    'flex h-7 w-full max-w-full cursor-pointer items-center gap-2.5 rounded-md px-4 text-left font-mono text-sm leading-7 outline-0',
    isSelected ? 'bg-base-100' : 'hover:bg-neutral-800',
  ]}
  {onclick}
>
  <div class={['inline-block size-1.5 shrink-0 rounded-full', dotColor]}></div>

  <span class="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
    <span class="flex shrink-0 items-center gap-2">
      {#if namespace}
        <span
          class="shrink-0 rounded-sm bg-base-300 px-[5px] py-[3px] text-xs leading-none"
        >
          {namespace}
        </span>
      {/if}
      <LogRowTime date={rawDate} />
    </span>
    <span
      class="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
    >
      {message}
    </span>
  </span>
</button>
