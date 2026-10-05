<script lang="ts" generics="T extends string">
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  type Option = {
    value: T;
    label: string;
    locked?: boolean;
  };

  type Props = {
    options: Option[];
    selected: T;
    label?: string;
    onSelect: (value: T) => void;
  };

  const { options, selected, label = 'Time range', onSelect }: Props = $props();
</script>

<div class="flex items-center gap-0.5" role="group" aria-label={label}>
  {#each options as option (option.value)}
    {#if option.locked}
      <Tooltip content="Upgrade to see {option.label}" placement="bottom">
        {@render rangeButton(option)}
      </Tooltip>
    {:else}
      {@render rangeButton(option)}
    {/if}
  {/each}
</div>

{#snippet rangeButton(option: Option)}
  <button
    type="button"
    aria-pressed={selected === option.value}
    class={[
      'transition-ink focus-visible:outline-brand flex h-7 cursor-pointer items-center rounded-md px-2 text-[13px] tabular-nums focus-visible:outline-2',
      {
        'bg-surface-150-bg text-fg-default': selected === option.value,
        'text-fg-muted hover:text-fg-default':
          selected !== option.value && !option.locked,
        'text-fg-faint hover:text-fg-tertiary': option.locked,
      },
    ]}
    onclick={() => onSelect(option.value)}
  >
    {option.label}
  </button>
{/snippet}
