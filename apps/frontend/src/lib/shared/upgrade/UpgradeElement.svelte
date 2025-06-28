<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { upgradeState } from './upgrade.state.svelte.js';
  import {
    startTierUpgrade,
    type UpgradeSource,
  } from './start-tier-upgrade.util.js';
  import type { PostHog } from 'posthog-js';

  type Props = {
    class?: ClassValue;
    children?: Snippet;
    enabled?: boolean;
    source?: UpgradeSource;
    onClick?: () => void;
  };
  const {
    class: className = '',
    children,
    enabled = true,
    source = 'unknown',
    onClick,
  }: Props = $props();

  const posthog = getContext<PostHog>('posthog');

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
    onClick?.();
    if (enabled) {
      startTierUpgrade(posthog, source);
    }
  }}
  role="button"
>
  {@render children?.()}
</div>
