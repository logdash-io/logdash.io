<script lang="ts" generics="T extends string">
  type Props = {
    legend: string;
    options: { value: T; label: string }[];
    value: T;
  };

  let { legend, options, value = $bindable() }: Props = $props();

  const name = $props.id();
</script>

<fieldset class="min-w-0">
  <legend class="text-fg-tertiary mb-1.5 text-[13px]">{legend}</legend>
  <div
    class="inset-ring-surface-root-border flex w-fit flex-wrap gap-0.5 rounded-lg p-0.5 inset-ring"
  >
    {#each options as option (option.value)}
      <label
        class={[
          'text-fg-tertiary hover:text-fg-secondary flex h-8 cursor-pointer items-center rounded-md px-3 text-[13px] font-medium',
          'transition-ink duration-150 motion-reduce:transition-none',
          'has-checked:bg-surface-150-bg has-checked:text-fg-default has-focus-visible:shadow-(--focus-ring)',
        ]}
      >
        <input
          type="radio"
          {name}
          value={option.value}
          bind:group={value}
          class="sr-only"
        />
        {option.label}
      </label>
    {/each}
  </div>
</fieldset>
