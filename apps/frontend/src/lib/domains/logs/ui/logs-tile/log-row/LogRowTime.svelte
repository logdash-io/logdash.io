<script lang="ts">
  import { DateTime } from 'luxon';
  import { match } from 'ts-pattern';
  import { timeDisplayState } from '$lib/domains/logs/infrastructure/time-display.state.svelte.js';

  type Props = {
    date: Date;
    level: string;
  };

  let { date: rawDate, level }: Props = $props();

  function formatTimeAgo(date: Date): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diffMs = now - then;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }

    if (diffHours < 24) {
      return `${diffHours}h`;
    }

    return `${diffDays}d`;
  }

  let timeAgo = $state('');

  $effect(() => {
    const date = rawDate;
    timeAgo = formatTimeAgo(date);

    if (!timeDisplayState.isRelative) {
      return;
    }

    const now = Date.now();
    const then = new Date(date).getTime();
    const diffMs = now - then;
    const diffSeconds = Math.floor(diffMs / 1000);

    const intervalMs = diffSeconds < 60 ? 1000 : 60000;

    const intervalId = setInterval(() => {
      timeAgo = formatTimeAgo(date);
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  });

  const isoString = $derived(
    DateTime.fromJSDate(new Date(rawDate))
      .toLocal()
      .toISO({ includeOffset: true }) || '',
  );

  const [left, right] = $derived(isoString.split('T'));
  const absoluteDate = $derived(left);
  const absoluteTime = $derived(right?.split('+')[0] || '');
  const timeParts = $derived(absoluteTime.split('.'));
  const brightTimeNumbers = $derived(timeParts.slice(0, -1));
  const darkTimeNumber = $derived(timeParts[timeParts.length - 1]);

  const secondaryTextColor = $derived(
    match(level)
      .with('info', () => 'text-secondary/60')
      .with('warning', () => 'text-warning-content/60')
      .with('error', () => 'text-error-content/60')
      .with('success', () => 'text-success/60')
      .otherwise(() => 'text-secondary/60'),
  );
</script>

{#if timeDisplayState.isRelative}
  <span
    class={[
      'text-sm leading-7 whitespace-nowrap tabular-nums shrink-0',
      secondaryTextColor,
    ]}
  >
    {timeAgo}
  </span>
{:else}
  <span class="flex text-sm leading-7 whitespace-nowrap tabular-nums shrink-0">
    <span class={secondaryTextColor}>{absoluteDate}&nbsp;</span>
    {#each brightTimeNumbers as number, i}
      <span>{number}</span>
      {#if i < brightTimeNumbers.length - 1}
        <span class="font-normal">.</span>
      {/if}
    {/each}
    <span class={['font-normal', secondaryTextColor]}>.{darkTimeNumber}</span>
  </span>
{/if}
