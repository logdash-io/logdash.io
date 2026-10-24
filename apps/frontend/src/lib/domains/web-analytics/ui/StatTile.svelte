<script lang="ts">
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  type Props = {
    label: string;
    value: string;
    change: number | null;
    loading: boolean;
    hint?: string;
    lowerIsBetter?: boolean;
    selected?: boolean;
    onselect?: () => void;
  };

  const {
    label,
    value,
    change,
    loading,
    hint,
    lowerIsBetter = false,
    selected = false,
    onselect,
  }: Props = $props();

  const rounded = $derived(change === null ? null : Math.round(change));
  const better = $derived(
    change !== null && (lowerIsBetter ? change < 0 : change > 0),
  );
</script>

<div
  class={[
    'relative flex min-w-0 flex-col gap-1.5 rounded-lg p-3',
    selected
      ? 'bg-surface-25-selected-bg'
      : { 'hover:bg-surface-25-hover-bg': !!onselect },
  ]}
>
  <dt
    class={[
      'flex items-center text-xs',
      selected ? 'text-fg-default' : 'text-fg-muted',
    ]}
  >
    {#if hint}
      <Tooltip content={hintBox} placement="top" align="left">
        {@render name()}
      </Tooltip>
    {:else}
      {@render name()}
    {/if}
  </dt>
  <dd class="font-mono text-2xl tabular-nums">
    {#if loading}
      <span class="bg-surface-150-bg block h-8 w-16 rounded-md"></span>
    {:else}
      {value}
    {/if}
  </dd>
  <dd class="h-4 text-xs tabular-nums">
    {#if rounded !== null && !loading}
      <span
        class={[
          rounded === 0
            ? 'text-fg-muted'
            : better
              ? 'text-success'
              : 'text-error',
        ]}
        title="Compared with the previous period"
      >
        {rounded === 0 ? '' : rounded > 0 ? '↑' : '↓'}
        {Math.abs(rounded)}%
      </span>
    {/if}
  </dd>
</div>

{#snippet name()}
  {#if onselect}
    <button
      type="button"
      class={[
        'focus-visible:outline-brand cursor-pointer text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2',
        {
          'decoration-fg-faint underline decoration-dotted underline-offset-4':
            hint,
        },
      ]}
      aria-pressed={selected}
      onclick={onselect}
    >
      {label}
    </button>
  {:else}
    <span
      class={{
        'decoration-fg-faint underline decoration-dotted underline-offset-4':
          hint,
      }}
    >
      {label}
    </span>
  {/if}
{/snippet}

{#snippet hintBox()}
  <p
    class="bg-surface-elevated-bg edge text-fg-secondary max-w-72 rounded-lg px-3 py-2 text-xs leading-5 shadow"
  >
    {hint}
  </p>
{/snippet}
