<script lang="ts">
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import { formatCount } from '../../domain/analytics-format';

  type Props = {
    shown: number;
    total: number | null;
    label: string;
    onopen: () => void;
  };

  const { shown, total, label, onopen }: Props = $props();
</script>

<button
  type="button"
  class="group text-fg-tertiary hover:bg-surface-25-hover-bg hover:text-fg-default focus-visible:outline-brand flex h-8 w-full shrink-0 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-[13px] focus-visible:outline-2"
  onclick={onopen}
>
  <span class="min-w-0 truncate">
    {#if total === null}
      More {label}
    {:else}
      <b
        class="text-fg-secondary group-hover:text-fg-default font-medium tabular-nums"
      >
        {formatCount(Math.max(0, total - shown))}
      </b>
      more {label}
    {/if}
  </span>
  <span class="flex shrink-0 items-center gap-1.5">
    Show all{total === null ? '' : ` ${formatCount(total)}`}
    <ChevronRightIcon class="size-3.5" />
  </span>
</button>
