<script lang="ts">
  import type { ClassValue, HTMLInputAttributes } from 'svelte/elements';

  type Props = {
    label: string;
    value: string;
    prefix?: string;
    suffix?: string;
    hint?: string;
    invalid?: boolean;
    mono?: boolean;
    hideLabel?: boolean;
    inputmode?: HTMLInputAttributes['inputmode'];
    placeholder?: string;
    describedby?: string;
    class?: ClassValue;
  };

  let {
    label,
    value = $bindable(),
    prefix,
    suffix,
    hint,
    invalid = false,
    mono = false,
    hideLabel = false,
    inputmode = 'text',
    placeholder,
    describedby,
    class: className,
  }: Props = $props();

  const id = $props.id();
</script>

<div class={['flex min-w-0 flex-col gap-1.5', className]}>
  <label
    for={id}
    class={['text-fg-tertiary text-[13px]', { 'sr-only': hideLabel }]}
  >
    {label}
  </label>
  <div
    class={[
      'inset-ring-surface-root-border bg-surface-root-bg flex h-10 items-center gap-1 rounded-lg px-3 inset-ring',
      'transition-shadow duration-150 motion-reduce:transition-none',
      'hover:not-focus-within:inset-ring-surface-input-border',
      'focus-within:inset-ring-surface-input-hover-border focus-within:shadow-(--focus-ring)',
      {
        'inset-ring-error! focus-within:shadow-(--focus-ring-error)!': invalid,
      },
    ]}
  >
    {#if prefix}
      <span aria-hidden="true" class="text-fg-muted text-[15px]">
        {prefix}
      </span>
    {/if}
    <input
      {id}
      bind:value
      type="text"
      {inputmode}
      {placeholder}
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={describedby}
      class={[
        'selection:bg-surface-200-bg placeholder:text-fg-faint h-full w-full min-w-0 bg-transparent tabular-nums outline-none',
        mono ? 'font-mono text-sm' : 'text-[15px]',
      ]}
    />
    {#if suffix}
      <span aria-hidden="true" class="text-fg-muted text-[15px]">
        {suffix}
      </span>
    {/if}
  </div>
  {#if hint}
    <span class="text-fg-faint font-mono text-xs">{hint}</span>
  {/if}
</div>
