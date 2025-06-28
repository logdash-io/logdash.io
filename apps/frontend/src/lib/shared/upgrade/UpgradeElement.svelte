<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { upgradeState } from './upgrade.state.svelte.js';
  import { startTierUpgrade } from './start-tier-upgrade.util.js';

  type Props = {
    class?: ClassValue;
    children?: Snippet;
    enabled?: boolean;
  };
  const { class: className = '', children, enabled = true }: Props = $props();

  const handleMouseEnter = () => {
    if (enabled) {
      upgradeState.showBackground();
    }
  };

  const handleMouseLeave = () => {
    if (enabled) {
      upgradeState.hideBackground();
    }
  };
</script>

<div
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  class={['cursor-pointer', className]}
  onclick={() => {
    if (enabled) {
      startTierUpgrade();
    }
  }}
  role="button"
>
  {@render children?.()}
</div>
