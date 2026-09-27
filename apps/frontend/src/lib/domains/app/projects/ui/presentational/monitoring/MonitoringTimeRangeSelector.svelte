<script lang="ts">
  import type { PingBucketPeriod } from '$lib/domains/app/projects/domain/monitoring/ping-bucket';

  interface Props {
    currentRange: PingBucketPeriod;
    onRangeChange: (range: PingBucketPeriod) => void;
  }

  let { currentRange, onRangeChange }: Props = $props();

  const hourlyOption: PingBucketPeriod = '90h';
  const dailyOption: PingBucketPeriod = '90d';
</script>

<div class="flex items-center justify-end">
  <div
    role="tablist"
    class={['text-neutral-200 rounded-lg font-mono shadow-none']}
  >
    <button
      role="tab"
      class={[
        'cursor-pointer',
        {
          'underline underline-offset-2': currentRange === hourlyOption,
        },
      ]}
      onclick={() => onRangeChange(hourlyOption)}
    >
      90h
    </button>
    |
    <button
      role="tab"
      class={[
        'cursor-pointer',
        {
          'underline underline-offset-2': currentRange === dailyOption,
        },
      ]}
      onclick={() => onRangeChange(dailyOption)}
    >
      90d
    </button>
  </div>
</div>
