<script lang="ts">
  import { LOG_LEVELS_MAP } from '$lib/domains/logs/domain/log-level-metadata.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level.js';
  import LogRowTime from './LogRowTime.svelte';

  type Props = {
    index: number;
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
    {
      'bg-base-100': isSelected && level !== 'error' && level !== 'warning',
      'hover:bg-base-100/50':
        !isSelected && level !== 'error' && level !== 'warning',
      'bg-warning/20 text-warning-content hover:bg-warning/30':
        level === 'warning' && !isSelected,
      'bg-warning/40 text-warning-content': level === 'warning' && isSelected,
      'bg-error/20 text-error-content hover:bg-error/30':
        level === 'error' && !isSelected,
      'bg-error/40 text-error-content': level === 'error' && isSelected,
    },
  ]}
  {onclick}
>
  <div class={['inline-block h-2 w-2 shrink-0 rounded-full', dotColor]}></div>

  <span class="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
    <span class="flex shrink-0 items-center gap-2">
      {#if namespace}
        <span
          class="shrink-0 rounded-sm bg-base-300 px-[5px] py-[3px] text-xs leading-none"
        >
          {namespace}
        </span>
      {/if}
      <LogRowTime date={rawDate} {level} />
    </span>
    <span
      class="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
    >
      {message}
    </span>
  </span>
</button>
