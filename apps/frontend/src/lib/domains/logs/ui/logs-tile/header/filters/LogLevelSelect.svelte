<script lang="ts">
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import { ChevronDownIcon } from 'lucide-svelte';

  type Props = {
    selectedLevel: string | null;
    onLevelChange: (level: string | null) => void;
  };

  const { selectedLevel, onLevelChange }: Props = $props();

  const LOG_LEVELS = [
    { value: 'error', label: 'Error', color: 'bg-[#e7000b]' },
    { value: 'warning', label: 'Warning', color: 'bg-[#fe9a00]' },
    { value: 'info', label: 'Info', color: 'bg-[#155dfc]' },
    { value: 'http', label: 'HTTP', color: 'bg-[#00a6a6]' },
    { value: 'verbose', label: 'Verbose', color: 'bg-[#00a600]' },
    { value: 'debug', label: 'Debug', color: 'bg-[#00a600]' },
    { value: 'silly', label: 'Silly', color: 'bg-[#505050]' },
    { value: null, label: 'All Levels', color: 'bg-[#ffffff]' },
  ];

  function getSelectedLabel(): string {
    if (!selectedLevel) return 'All Levels';
    const level = LOG_LEVELS.find((l) => l.value === selectedLevel);
    return level?.label || 'All Levels';
  }

  function getSelectedColor(): string | null {
    if (!selectedLevel) return null;
    const level = LOG_LEVELS.find((l) => l.value === selectedLevel);
    return level?.color || null;
  }
</script>

{#snippet menu(close: () => void)}
  <div
    class="dropdown-content text-secondary ld-card-base rounded-box z-1 w-fit p-2 whitespace-nowrap shadow"
  >
    <ul class="">
      {#each LOG_LEVELS as level}
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

<Tooltip class="w-full" content={menu} interactive={true} placement="bottom">
  <button
    class="btn btn-sm btn-subtle w-full justify-start gap-1.5"
    data-posthog-id="logs-level-select"
  >
    <span class="flex w-full items-center gap-2">
      {#if getSelectedColor()}
        <div class={['h-2 w-2 rounded-full', getSelectedColor()]}></div>
      {/if}
      {getSelectedLabel()}
    </span>
    <ChevronDownIcon class="h-4 w-4" />
  </button>
</Tooltip>
