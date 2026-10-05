<script lang="ts">
  import { Badge, Button, Checkbox } from '@logdash/hyper-ui/presentational';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import SveltyPicker from 'svelty-picker';
  import { filtersStore } from '$lib/domains/logs/infrastructure/filters.store.svelte.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level';
  import { LOG_LEVELS } from '$lib/domains/logs/domain/log-level-metadata';
  import {
    TIME_RANGE_PRESETS,
    type TimeRangeValue,
    getDatesForTimeRange,
    formatTimeRangeLabel,
    isTimeRangeExceedingLimit,
    isCustomRangeExceedingLimit,
  } from '$lib/domains/logs/domain/time-range';
  import { namespacesState } from '$lib/domains/logs/infrastructure/namespaces.state.svelte.js';
  import { tick, type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  type Props = {
    maxDateRangeHours: number;
    close: () => void;
  };

  const { maxDateRangeHours, close }: Props = $props();

  type Menu = 'level' | 'time-range' | 'namespace';
  type SubmenuSide = 'left' | 'right' | 'below';
  type MenuRow = {
    id: Menu;
    label: string;
    count?: number;
    badgeClass?: string;
    submenuClass: string;
    submenu: Snippet<[() => void]>;
  };

  const SUBMENU_WIDTH_PX = 232;
  const SUBMENU_POSITION: Record<SubmenuSide, string> = {
    right: '-top-2 left-full',
    left: '-top-2 right-full',
    below: 'top-full right-0 mt-1',
  };
  const SUBMENU_ITEMS = 'input, button, [tabindex="0"]';
  const FOCUS_CLASS =
    'outline-none focus-visible:bg-surface-elevated-hover-bg focus-visible:shadow-(--focus-ring)';
  const INLINE_SUBMENU_CLASS = 'my-0.5 ml-3 edge-l pl-1';
  const SELECTABLE_ROW_CLASS =
    'hover:bg-surface-elevated-hover-bg flex items-center gap-1.5 rounded-lg pl-3 has-[>button:focus-visible]:bg-surface-elevated-hover-bg has-[>button:focus-visible]:shadow-(--focus-ring)';

  const floating = new MediaQuery('min-width: 640px');

  let openMenu = $state<Menu | null>(null);
  let submenuSide = $state<SubmenuSide>('right');
  const rowButtons: Partial<Record<Menu, HTMLButtonElement>> = {};

  const submenuClass = $derived(
    floating.current
      ? [
          'bg-surface-elevated-bg border-surface-elevated-border absolute z-50 rounded-xl border whitespace-nowrap shadow-lg',
          SUBMENU_POSITION[submenuSide],
        ]
      : INLINE_SUBMENU_CLASS,
  );

  const menuRows: MenuRow[] = $derived([
    {
      id: 'level',
      label: 'Level',
      count: filtersStore.levels.length,
      badgeClass: 'min-w-4',
      submenuClass: 'w-fit p-1.5',
      submenu: levelSubmenu,
    },
    {
      id: 'time-range',
      label: 'Time range',
      submenuClass: 'w-56 p-1.5',
      submenu: timeRangeSubmenu,
    },
    {
      id: 'namespace',
      label: 'Namespace',
      count: filtersStore.namespaces.length,
      badgeClass: 'min-w-6',
      submenuClass: 'w-fit p-1',
      submenu: namespaceSubmenu,
    },
  ]);

  const availableNamespaces = $derived(namespacesState.namespaces);
  const loadingNamespaces = $derived(namespacesState.loading);
  let showCustomDatePicker = $state(false);
  let customStartDate = $state('');
  let customEndDate = $state('');

  const currentTimeRangeLabel = $derived(
    formatTimeRangeLabel(filtersStore.startDate, filtersStore.endDate),
  );

  const isCustomRangeUpgradeRequired = $derived(
    Boolean(customStartDate && customEndDate) &&
      isCustomRangeExceedingLimit(
        customStartDate,
        customEndDate,
        maxDateRangeHours,
      ),
  );

  async function openSubmenu(
    menu: Menu,
    row: HTMLElement,
    focusFirstItem = false,
  ): Promise<void> {
    const { left, right } = row.getBoundingClientRect();

    openMenu = menu;
    submenuSide =
      right + SUBMENU_WIDTH_PX <= window.innerWidth
        ? 'right'
        : left - SUBMENU_WIDTH_PX >= 0
          ? 'left'
          : 'below';

    if (!focusFirstItem) return;
    await tick();
    rowButtons[menu]?.nextElementSibling
      ?.querySelector<HTMLElement>(SUBMENU_ITEMS)
      ?.focus();
  }

  function closeSubmenu(menu: Menu): void {
    openMenu = null;
    rowButtons[menu]?.focus();
  }

  function onRowClick(
    event: MouseEvent & { currentTarget: HTMLButtonElement },
    menu: Menu,
  ): void {
    const byKeyboard = event.detail === 0;
    if (!floating.current && !byKeyboard && openMenu === menu) {
      openMenu = null;
      return;
    }
    void openSubmenu(menu, event.currentTarget, byKeyboard);
  }

  function onRowEnter(
    event: MouseEvent & { currentTarget: HTMLLIElement },
    menu: Menu,
  ): void {
    if (floating.current) {
      void openSubmenu(menu, event.currentTarget);
    }
  }

  function onRowKeydown(
    event: KeyboardEvent & { currentTarget: HTMLButtonElement },
    menu: Menu,
  ): void {
    if (event.key !== 'ArrowRight') return;
    event.preventDefault();
    void openSubmenu(menu, event.currentTarget, true);
  }

  function onSubmenuKeydown(event: KeyboardEvent, menu: Menu): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'Escape') return;
    event.preventDefault();
    closeSubmenu(menu);
  }

  function onRowLeave(
    event: MouseEvent & { currentTarget: HTMLLIElement },
    menu: Menu,
  ): void {
    if (!floating.current) return;
    if (event.currentTarget.contains(document.activeElement)) {
      closeSubmenu(menu);
      return;
    }
    openMenu = null;
  }

  function onRowFocusOut(
    event: FocusEvent & { currentTarget: HTMLLIElement },
    menu: Menu,
  ): void {
    const leftRow =
      event.relatedTarget instanceof Node &&
      !event.currentTarget.contains(event.relatedTarget);
    if (leftRow && openMenu === menu) {
      openMenu = null;
    }
  }

  function onLevelToggle(level: LogLevel): void {
    filtersStore.toggleLevel(level);
  }

  function onLevelClick(
    e: MouseEvent,
    level: LogLevel,
    close: () => void,
  ): void {
    if (e.metaKey || e.shiftKey) {
      filtersStore.toggleLevel(level);
      return;
    }
    const isOnlySelectedLevel =
      filtersStore.levels.length === 1 && filtersStore.hasLevel(level);
    if (isOnlySelectedLevel) {
      filtersStore.setLevels([]);
      close();
      return;
    }
    filtersStore.setLevels([level]);
    close();
  }

  function onNamespaceToggle(namespace: string): void {
    filtersStore.toggleNamespace(namespace);
  }

  function onNamespaceClick(
    e: MouseEvent,
    namespace: string,
    close: () => void,
  ): void {
    if (e.metaKey || e.shiftKey) {
      filtersStore.toggleNamespace(namespace);
      return;
    }
    const isOnlySelectedNamespace =
      filtersStore.namespaces.length === 1 &&
      filtersStore.hasNamespace(namespace);
    if (isOnlySelectedNamespace) {
      filtersStore.setNamespaces([]);
      close();
      return;
    }
    filtersStore.setNamespaces([namespace]);
    close();
  }

  function onTimeRangeSelect(
    rangeValue: TimeRangeValue,
    close: () => void,
  ): void {
    if (rangeValue === 'custom') {
      showCustomDatePicker = true;
      return;
    }

    const { startDate, endDate } = getDatesForTimeRange(rangeValue);
    filtersStore.setFilters({ startDate, endDate });
    close();
  }

  function onCustomDateApply(close: () => void): void {
    if (!customStartDate || !customEndDate) return;

    filtersStore.setFilters({
      startDate: new Date(customStartDate).toISOString(),
      endDate: new Date(customEndDate).toISOString(),
    });
    showCustomDatePicker = false;
    close();
  }

  function onCustomDateCancel(): void {
    showCustomDatePicker = false;
    customStartDate = '';
    customEndDate = '';
  }

  function onClearLevels(
    event: MouseEvent & { currentTarget: HTMLButtonElement },
  ): void {
    filtersStore.setLevels([]);
    event.currentTarget
      .closest('ul')
      ?.querySelector<HTMLElement>(SUBMENU_ITEMS)
      ?.focus();
  }
</script>

<div
  class="fixed inset-0 z-[-1]"
  onmousedown={close}
  role="button"
  tabindex="-1"
></div>
<div
  class="text-fg-default bg-surface-elevated-bg border-surface-elevated-border z-1 w-fit rounded-xl border p-0.5 shadow"
>
  {#if showCustomDatePicker}
    {@render customDatePickerContent(close)}
  {:else}
    <ul class="w-fit whitespace-nowrap p-1 text-sm">
      {#each menuRows as row (row.id)}
        <li
          class="relative"
          onmouseenter={(event) => onRowEnter(event, row.id)}
          onmouseleave={(event) => onRowLeave(event, row.id)}
          onfocusout={(event) => onRowFocusOut(event, row.id)}
        >
          <button
            bind:this={rowButtons[row.id]}
            type="button"
            aria-haspopup="true"
            aria-expanded={openMenu === row.id}
            class={[
              FOCUS_CLASS,
              'flex w-full cursor-pointer items-center justify-between gap-6 rounded-lg px-3 py-2 text-left',
              'aria-expanded:bg-surface-elevated-hover-bg',
            ]}
            onclick={(event) => onRowClick(event, row.id)}
            onkeydown={(event) => onRowKeydown(event, row.id)}
          >
            <span class="flex items-center gap-2">
              <span>{row.label}</span>
              {#if row.count !== undefined}
                <Badge
                  size="xs"
                  class={[row.badgeClass, { invisible: row.count === 0 }]}
                >
                  {row.count}
                </Badge>
              {/if}
            </span>
            <ChevronRightIcon
              class={[
                'h-4 w-4 text-fg-muted transition-transform',
                { 'rotate-90': !floating.current && openMenu === row.id },
              ]}
            />
          </button>
          {#if openMenu === row.id}
            <div
              role="presentation"
              class={[submenuClass, floating.current && row.submenuClass]}
              onkeydown={(event) => onSubmenuKeydown(event, row.id)}
            >
              {@render row.submenu(close)}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#snippet levelSubmenu(close: () => void)}
  <ul class="p-0">
    {#each LOG_LEVELS as level (level.value)}
      {@const isSelected = filtersStore.hasLevel(level.value)}
      <li
        class={[
          SELECTABLE_ROW_CLASS,
          { 'bg-surface-elevated-selected-bg': isSelected },
        ]}
      >
        <Checkbox
          size="xs"
          checked={isSelected}
          aria-label="Include {level.label}"
          onchange={() => onLevelToggle(level.value)}
        />
        <button
          type="button"
          class="flex flex-1 cursor-pointer items-center gap-1.5 py-1.5 pr-3 text-left outline-none"
          onclick={(e: MouseEvent) => onLevelClick(e, level.value, close)}
        >
          <span class={['size-2 rounded-full', level.color]}></span>
          <span>{level.label}</span>
        </button>
      </li>
    {/each}
    {#if filtersStore.levels.length > 0}
      <li class="border-surface-elevated-border mt-1 border-t pt-1">
        <button
          type="button"
          class={[
            FOCUS_CLASS,
            'hover:bg-surface-elevated-hover-bg text-fg-tertiary w-full rounded-lg px-3 py-1.5 text-left text-xs',
          ]}
          onclick={onClearLevels}
        >
          Clear all levels
        </button>
      </li>
    {/if}
  </ul>
{/snippet}

{#snippet timeRangeSubmenu(close: () => void)}
  <ul class="p-0">
    {#each TIME_RANGE_PRESETS as range (range.value)}
      {@const requiresUpgrade = isTimeRangeExceedingLimit(
        range.hours,
        maxDateRangeHours,
      )}
      <li>
        <UpgradeElement
          class={[
            FOCUS_CLASS,
            'hover:bg-surface-elevated-hover-bg flex w-full items-center justify-between gap-4 rounded-lg px-3 py-1.5 text-left',
            {
              'bg-surface-elevated-selected-bg':
                currentTimeRangeLabel === range.label,
            },
          ]}
          onclick={() => {
            if (requiresUpgrade) {
              close();
              return;
            }
            onTimeRangeSelect(range.value, close);
          }}
          enabled={requiresUpgrade}
          source="logs-date-range"
          interactive={true}
        >
          <span>{range.label}</span>
          {#if requiresUpgrade}
            <Badge size="xs">Upgrade</Badge>
          {/if}
        </UpgradeElement>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet namespaceSubmenu(close: () => void)}
  <ul class="p-0">
    {#if loadingNamespaces}
      <li class="px-3 py-1.5 text-fg-tertiary">Loading namespaces</li>
    {:else if availableNamespaces.length === 0}
      <li class="px-3 py-1.5 text-fg-tertiary">No namespaces</li>
    {:else}
      {#each availableNamespaces as nsMetadata (nsMetadata.namespace)}
        {@const isSelected = filtersStore.hasNamespace(nsMetadata.namespace)}
        <li
          class={[
            SELECTABLE_ROW_CLASS,
            { 'bg-surface-elevated-selected-bg': isSelected },
          ]}
        >
          <Checkbox
            size="xs"
            checked={isSelected}
            aria-label="Include {nsMetadata.namespace}"
            onchange={() => onNamespaceToggle(nsMetadata.namespace)}
          />
          <button
            type="button"
            class="flex flex-1 cursor-pointer items-center py-1.5 pr-3 text-left outline-none"
            onclick={(e: MouseEvent) =>
              onNamespaceClick(e, nsMetadata.namespace, close)}
          >
            {nsMetadata.namespace}
          </button>
        </li>
      {/each}
    {/if}
  </ul>
{/snippet}

{#snippet customDatePickerContent(close: () => void)}
  <div class="w-56 space-y-3 p-2">
    <div class="text-sm font-medium">Custom range</div>
    <div class="space-y-2">
      <div class="space-y-1">
        <span class="text-fg-tertiary block text-xs">From</span>
        <SveltyPicker
          bind:value={customStartDate}
          mode="datetime"
          placeholder="Start date"
          inputClasses="ld-input ld-input-padding w-full text-xs"
          displayFormat="yyyy M dd, hh:ii"
        />
      </div>
      <div class="space-y-1">
        <span class="text-fg-tertiary block text-xs">To</span>
        <SveltyPicker
          bind:value={customEndDate}
          mode="datetime"
          placeholder="End date"
          inputClasses="ld-input ld-input-padding w-full text-xs"
          displayFormat="yyyy M dd, hh:ii"
        />
      </div>
    </div>
    <div class="flex gap-2">
      <Button size="xs" class="flex-1" onclick={onCustomDateCancel}>
        Cancel
      </Button>
      <UpgradeElement
        enabled={isCustomRangeUpgradeRequired}
        source="logs-filter-dropdown"
        class="flex flex-1"
        interactive={Boolean(customStartDate && customEndDate)}
        onclick={() => onCustomDateApply(close)}
      >
        <Button
          as="span"
          variant={customStartDate && customEndDate ? 'primary' : 'secondary'}
          size="xs"
          block
        >
          Apply
        </Button>
      </UpgradeElement>
    </div>
  </div>
{/snippet}
