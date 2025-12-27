<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import {
    LOG_LEVELS,
    getLogLevelMetadata,
  } from '$lib/domains/logs/domain/log-level-metadata';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level';

  type Props = {
    selectedLevel: string | null;
    onLevelChange: (level: string | null) => void;
  };

  const { selectedLevel, onLevelChange }: Props = $props();

  const ALL_LEVELS_OPTION = {
    value: null,
    label: 'All Levels',
    color: 'bg-[#ffffff]',
  };
  const levelOptions = [...LOG_LEVELS, ALL_LEVELS_OPTION];

  function getSelectedLabel(): string {
    if (!selectedLevel) return 'All Levels';
    return (
      getLogLevelMetadata(selectedLevel as LogLevel)?.label || 'All Levels'
    );
  }

  function getSelectedColor(): string | null {
    if (!selectedLevel) return null;
    return getLogLevelMetadata(selectedLevel as LogLevel)?.color || null;
  }
</script>

{#snippet menu(close: () => void)}
  <div
    class="dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit whitespace-nowrap p-2 shadow"
  >
    <ul class="">
      {#each levelOptions as level}
        <li
          class="hover:bg-base-100 flex items-center justify-start rounded-lg px-3"
        >
          <button
            onclick={() => {
              onLevelChange(level.value);
              close();
            }}
            class="flex w-full cursor-pointer items-center justify-start gap-3 py-1.5"
          >
            <span class="flex items-center gap-3">
              <div class={['h-2 w-2 rounded-full', level.color]}></div>
              {level.label}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

<Tooltip
  class="w-full"
  content={menu}
  interactive={true}
  placement="bottom"
  trigger="click"
  closeOnOutsideTooltipClick={true}
>
  <button
    class="btn btn-sm btn-subtle w-full justify-between gap-1.5"
    data-posthog-id="logs-level-select"
  >
    <span class="flex w-full items-center gap-2">
      {#if getSelectedColor()}
        <div class={['h-2 w-2 rounded-full', getSelectedColor()]}></div>
      {/if}
      {getSelectedLabel()}
    </span>
    <ChevronDownIcon class="h-4 w-4 shrink-0" />
  </button>
</Tooltip>
