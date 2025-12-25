<script lang="ts">
  import { match } from 'ts-pattern';

  type Props = {
    date: Date;
    level: string;
  };

  const { date: rawDate, level }: Props = $props();

  function formatTimeAgo(date: Date): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diffMs = now - then;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return `< 1m`;
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }

    return `${diffHours}h`;
  }

  let timeAgo = $state(formatTimeAgo(rawDate));

  $effect(() => {
    const update = (): void => {
      timeAgo = formatTimeAgo(rawDate);
    };

    update();

    const now = Date.now();
    const then = new Date(rawDate).getTime();
    const diffMs = now - then;
    const diffSeconds = Math.floor(diffMs / 1000);

    const intervalMs = diffSeconds < 60 ? 1000 : 60000;

    const intervalId = setInterval(update, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  });

  const textColor = match(level)
    .with('info', () => 'text-secondary/60')
    .with('warning', () => 'text-warning-content/60')
    .with('error', () => 'text-error-content/60')
    .with('success', () => 'text-success/60')
    .otherwise(() => 'text-secondary/60');
</script>

<span class={['text-sm leading-7 whitespace-nowrap tabular-nums', textColor]}>
  {timeAgo} ago
</span>
