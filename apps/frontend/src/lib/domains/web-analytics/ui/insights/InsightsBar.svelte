<script lang="ts">
  import {
    MENU_PANEL,
    MENU_ROW,
    onMenuArrowKeys,
  } from '$lib/domains/app/clusters/ui/menu';
  import EyeOffIcon from '$lib/domains/shared/icons/EyeOffIcon.svelte';
  import GridIcon from '$lib/domains/shared/icons/GridIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { TOOLBAR_CONTROL } from '$lib/domains/shared/ui/components/toolbar';
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
    onview: (id: string) => void;
    onrestore: (insight: WebAnalyticsInsight) => void;
    onlayout: () => void;
    onadd: () => void;
  };

  const {
    views,
    active,
    hidden,
    canAdd,
    onview,
    onrestore,
    onlayout,
    onadd,
  }: Props = $props();

  const options = $derived(
    views.map((view) => ({ value: view.id, label: view.name })),
  );
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
  <div class="min-w-0">
    {#if views.length > 1}
      <SegmentedControl
        label="Dashboard view"
        {options}
        value={active.id}
        onChange={onview}
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

    <button
      type="button"
      class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
      onclick={onlayout}
    >
      <GridIcon class="size-3.5" />
      Layout
    </button>

    {#if canAdd}
      <button type="button" class={TOOLBAR_CONTROL} onclick={onadd}>
        <PlusIcon class="size-3.5" />
        Add insight
      </button>
    {/if}
  </div>
</div>
