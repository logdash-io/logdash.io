<script lang="ts">
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import { Input, Select } from '@logdash/hyper-ui/presentational';
  import type { WebAnalyticsInsightFilter } from '../../domain/web-analytics';
  import { INSIGHT_OPERATORS } from '../../domain/web-analytics-insight';

  type Props = {
    filters: WebAnalyticsInsightFilter[];
    keys: string[];
    label: string;
    addLabel: string;
  };

  let { filters = $bindable(), keys, label, addLabel }: Props = $props();

  const MAX_FILTERS = 5;
  const listId = $props.id();

  function onAdd(): void {
    filters.push({ key: '', op: 'eq', value: '' });
  }

  function onRemove(index: number): void {
    filters.splice(index, 1);
  }
</script>

<datalist id={listId}>
  {#each keys as key (key)}
    <option value={key}></option>
  {/each}
</datalist>

{#each filters as filter, index (index)}
  <div class="flex items-center gap-1.5">
    <Input
      bind:value={filter.key}
      size="sm"
      class="min-w-0 flex-1 font-mono"
      list={listId}
      placeholder="property"
      aria-label="{label} {index + 1} property"
    />
    <Select
      bind:value={filter.op}
      size="sm"
      class="w-16 shrink-0"
      aria-label="{label} {index + 1} comparison"
    >
      {#each INSIGHT_OPERATORS as operator (operator.value)}
        <option value={operator.value}>{operator.label}</option>
      {/each}
    </Select>
    <Input
      bind:value={filter.value}
      size="sm"
      class="min-w-0 flex-1 font-mono"
      placeholder="value"
      aria-label="{label} {index + 1} value"
    />
    <IconButton
      label="Remove {label.toLowerCase()} {index + 1}"
      onclick={() => onRemove(index)}
    >
      <CloseIcon class="size-3.5" />
    </IconButton>
  </div>
{/each}

{#if filters.length < MAX_FILTERS}
  <button
    type="button"
    class="text-fg-tertiary hover:text-fg-default transition-ink focus-visible:outline-brand flex h-7 w-fit cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-xs focus-visible:outline-2"
    onclick={onAdd}
  >
    <PlusIcon class="size-3" />
    {addLabel}
  </button>
{/if}
