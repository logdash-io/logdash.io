<script lang="ts" generics="T extends string">
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { TOOLBAR_GROUP, TOOLBAR_GROUP_OPTION } from './toolbar.js';

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

<div class={TOOLBAR_GROUP} role="radiogroup" aria-label={label}>
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
    role="radio"
    aria-checked={selected === option.value}
    class={[
      TOOLBAR_GROUP_OPTION,
      'tabular-nums',
      {
        'bg-surface-150-bg text-fg-default': selected === option.value,
        'text-fg-tertiary hover:text-fg-default':
          selected !== option.value && !option.locked,
        'text-fg-faint hover:text-fg-tertiary': option.locked,
      },
    ]}
    onclick={() => onSelect(option.value)}
  >
    {option.label}
  </button>
{/snippet}
