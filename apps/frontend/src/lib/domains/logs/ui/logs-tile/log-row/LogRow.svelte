<script lang="ts">
  import { LOG_LEVELS_MAP } from '$lib/domains/logs/domain/log-level-metadata.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level.js';
  import { DateTime } from 'luxon';
  import { relativeAge } from './relative-age.js';

  type Props = {
    date: Date;
    level: string;
    message: string;
    namespace?: string;
    prefix?: 'full' | 'short' | 'relative';
    selected?: boolean;
    onclick?: () => void;
  };

  const {
    date,
    level,
    message,
    namespace,
    prefix = 'full',
    selected = false,
    onclick,
  }: Props = $props();

  const SECOND_MS = 1_000;
  const MINUTE_MS = 60_000;

  let now = $state(Date.now());

  const local = $derived(DateTime.fromJSDate(new Date(date)).toLocal());
  const age = $derived(Math.max(0, now - local.toMillis()));
  const day = $derived(prefix === 'full' ? local.toFormat('yyyy-MM-dd') : null);
  const time = $derived(
    prefix === 'relative'
      ? relativeAge(age).padStart(3, '\u00a0')
      : local.toFormat('HH:mm:ss'),
  );
  const dotColor = $derived(
    LOG_LEVELS_MAP[level as LogLevel]?.color ?? 'bg-idle',
  );

  $effect(() => {
    if (prefix !== 'relative') {
      return;
    }

    const timer = setTimeout(
      () => {
        now = Date.now();
      },
      age < MINUTE_MS ? SECOND_MS : MINUTE_MS,
    );

    return () => clearTimeout(timer);
  });
</script>

{#if onclick}
  <button
    type="button"
    class={[
      'focus-visible:outline-brand focus-visible:-outline-offset-2 focus-visible:outline-2 flex h-7 w-full min-w-0 cursor-pointer items-center gap-2.5 px-4 text-left font-mono text-sm',
      selected
        ? 'bg-surface-50-selected-bg hover:bg-surface-150-hover-bg'
        : 'hover:bg-surface-50-hover-bg',
    ]}
    aria-pressed={selected}
    {onclick}
  >
    {@render content()}
  </button>
{:else}
  <div class="flex h-5 w-full min-w-0 items-center gap-2.5 font-mono text-sm">
    {@render content()}
  </div>
{/if}

{#snippet content()}
  <span class={['size-2 shrink-0 rounded-full', dotColor]}></span>

  <span class="text-fg-tertiary shrink-0 whitespace-nowrap tabular-nums">
    [{#if day}<span class="max-sm:hidden">{day}&nbsp;</span>{/if}{time}]
  </span>

  {#if namespace}
    <span class="text-fg-muted max-w-32 shrink-0 truncate">{namespace}</span>
  {/if}

  <span class="min-w-0 flex-1 truncate">{message}</span>
{/snippet}
