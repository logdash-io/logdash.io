<script lang="ts">
  import { DateTime } from 'luxon';
  import { match } from 'ts-pattern';

  type Props = {
    date: Date;
    level: string;
  };

  const { date: rawDate, level }: Props = $props();
  const [left, right] = DateTime.fromJSDate(new Date(rawDate))
    .toLocal()
    .toISO({ includeOffset: true })
    .split('T');

  const [date, time] = $derived([left, right.split('+')[0]]);
  const timeParts = $derived(time.split('.'));
  const brightTimeNumbers = $derived(timeParts.slice(0, -1));
  const darkTimeNumber = $derived(timeParts[timeParts.length - 1]);

  const secondaryTextColor = match(level)
    .with('info', () => 'text-secondary/60')
    .with('warning', () => 'text-warning-content/60')
    .with('error', () => 'text-error-content/60')
    .with('success', () => 'text-success/60')
    .otherwise(() => 'text-secondary/60');
</script>

<span class="flex text-sm leading-7 whitespace-nowrap">
  <span class={secondaryTextColor}>{date}&nbsp;</span>
  {#each brightTimeNumbers as number, i}
    <span class="">{number}</span>
    {#if i < brightTimeNumbers.length - 1}
      <span class="font-normal">.</span>
    {/if}
  {/each}
  <span class={['font-normal', secondaryTextColor]}>.{darkTimeNumber}</span>
</span>
