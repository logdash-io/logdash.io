<script lang="ts" generics="T extends string">
  type Option = {
    value: T;
    label: string;
  };

  type Props = {
    options: Option[];
    value: T;
    onChange: (value: T) => void;
    size?: 'sm' | 'xs';
  };

  let { options, value, onChange, size = 'sm' }: Props = $props();
</script>

<div class="join">
  {#each options as option (option.value)}
    <button
      type="button"
      class={[
        'join-item btn',
        size === 'xs' ? 'btn-xs' : 'btn-sm',
        value === option.value ? 'btn-primary' : 'btn-ghost',
      ]}
      aria-pressed={value === option.value}
      onclick={() => onChange(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>
