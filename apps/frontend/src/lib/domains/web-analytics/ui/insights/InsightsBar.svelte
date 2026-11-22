<script lang="ts">
  import {
    MENU_PANEL,
    MENU_ROW,
    onMenuArrowKeys,
  } from '$lib/domains/app/clusters/ui/menu';
  import EyeOffIcon from '$lib/domains/shared/icons/EyeOffIcon.svelte';
  import GridIcon from '$lib/domains/shared/icons/GridIcon.svelte';
  import GripIcon from '$lib/domains/shared/icons/GripIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import {
    TOOLBAR_CONTROL,
    TOOLBAR_PRIMARY,
  } from '$lib/domains/shared/ui/components/toolbar';
  import { Dropdown } from '@logdash/hyper-ui/presentational';
  import type {
    WebAnalyticsInsight,
    WebAnalyticsView,
  } from '../../domain/web-analytics';

  type Props = {
    views: WebAnalyticsView[];
    active: WebAnalyticsView;
    hidden: WebAnalyticsInsight[];
    canAdd: boolean;
    arranging: boolean;
    onview: (id: string) => void;
    onvieworder: (ids: string[]) => void;
    onrestore: (insight: WebAnalyticsInsight) => void;
    onviews: () => void;
    onarrange: () => void;
    onadd: () => void;
  };

  const {
    views,
    active,
    hidden,
    canAdd,
    arranging,
    onview,
    onvieworder,
    onrestore,
    onviews,
    onarrange,
    onadd,
  }: Props = $props();

  const options = $derived(
    views.map((view) => ({ value: view.id, label: view.name })),
  );
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
  <div class="min-w-0 overflow-x-auto [scrollbar-width:none]">
    {#if views.length > 1}
      <SegmentedControl
        label="Dashboard view"
        {options}
        value={active.id}
        onChange={onview}
        onReorder={onvieworder}
      />
    {/if}
  </div>

  <div class="flex flex-wrap items-center gap-2">
    {#if hidden.length}
      <Dropdown align="end">
        {#snippet trigger(attrs)}
          <button
            {...attrs}
            type="button"
            class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
            aria-haspopup="menu"
          >
            <EyeOffIcon class="size-3.5" />
            Hidden {hidden.length}
          </button>
        {/snippet}

        <div
          class={[MENU_PANEL, 'w-80']}
          role="menu"
          tabindex="-1"
          aria-label="Hidden cards"
          onkeydown={onMenuArrowKeys}
        >
          {#each hidden as insight (insight.id)}
            <button
              type="button"
              role="menuitem"
              class={MENU_ROW}
              aria-label="Show {insight.title}"
              onclick={() => onrestore(insight)}
            >
              <span class="min-w-0 flex-1 truncate">{insight.title}</span>
              <span class="text-fg-muted shrink-0">Show</span>
            </button>
          {/each}
        </div>
      </Dropdown>
    {/if}

    <div class="hidden @min-[49rem]:contents">
      <button
        type="button"
        class={arranging
          ? TOOLBAR_PRIMARY
          : [TOOLBAR_CONTROL, 'text-fg-tertiary']}
        aria-pressed={arranging}
        title={arranging
          ? 'Press Escape to finish'
          : 'Move and resize the cards in this view'}
        onclick={onarrange}
      >
        <GripIcon class="size-3.5" />
        {arranging ? 'Done' : 'Arrange'}
      </button>
    </div>

    <button
      type="button"
      class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
      onclick={onviews}
    >
      <GridIcon class="size-3.5" />
      Views
    </button>

    {#if canAdd}
      <button type="button" class={TOOLBAR_CONTROL} onclick={onadd}>
        <PlusIcon class="size-3.5" />
        Add insight
      </button>
    {/if}
  </div>
</div>
