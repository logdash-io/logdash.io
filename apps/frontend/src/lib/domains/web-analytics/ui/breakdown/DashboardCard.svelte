<script lang="ts">
  import ExpandIcon from '$lib/domains/shared/icons/ExpandIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import type { Snippet } from 'svelte';
  import { fitRows, type RowFit } from './fit-rows';
  import MoreRow from './MoreRow.svelte';

  type Props = {
    label: string;
    tabs?: Snippet;
    actions?: Snippet;
    expandLabel?: string;
    onexpand?: () => void;
    more?: string;
    total?: number | null;
    children: Snippet;
  };

  const {
    label,
    tabs,
    actions,
    expandLabel,
    onexpand,
    more,
    total,
    children,
  }: Props = $props();

  let fit = $state<RowFit>({ shown: 0, hidden: 0, more: false });

  function onFit(next: RowFit): void {
    fit = next;
  }
</script>

<section
  class="bg-surface-25-bg @container flex h-full min-w-0 flex-col gap-2 rounded-2xl p-2"
  aria-label={label}
>
  <header class="flex h-7 shrink-0 items-center justify-between gap-3">
    {#if tabs}
      <div class="min-w-0 overflow-x-auto [scrollbar-width:none]">
        {@render tabs()}
      </div>
    {:else}
      <h2 class="shrink-0 px-3 text-[13px] font-medium">{label}</h2>
    {/if}
    <div class={['flex items-center gap-1', tabs ? 'shrink-0' : 'min-w-0']}>
      {@render actions?.()}
      {#if onexpand}
        <IconButton
          well
          label={expandLabel ?? `Show all ${label.toLowerCase()}`}
          tooltip="Details"
          class="shrink-0"
          onclick={onexpand}
        >
          <ExpandIcon class="size-3.5" />
        </IconButton>
      {/if}
    </div>
  </header>

  <div
    class="relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden"
    {@attach fitRows(onFit, total)}
  >
    {@render children()}
    {#if more && onexpand && fit.more}
      <MoreRow
        shown={fit.shown}
        total={total === undefined ? fit.shown + fit.hidden : total}
        label={more}
        onopen={onexpand}
      />
    {/if}
  </div>
</section>
