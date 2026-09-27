<script lang="ts" generics="T extends string">
  import { Button } from '@logdash/hyper-ui/presentational';

  type Option = {
    value: T;
    label: string;
  };

  type Props = {
    options: Option[];
    /** `null` renders nothing selected — used where a choice must be explicit. */
    value: T | null;
    onChange: (value: T) => void;
    size?: 'sm' | 'xs';
  };

  let { options, value, onChange, size = 'sm' }: Props = $props();
</script>

<div class="inline-flex">
  {#each options as option (option.value)}
    <Button
      {size}
      variant={value === option.value ? 'primary' : 'ghost'}
      aria-pressed={value === option.value}
      onclick={() => onChange(option.value)}
    >
      {option.label}
    </Button>
  {/each}
</div>
