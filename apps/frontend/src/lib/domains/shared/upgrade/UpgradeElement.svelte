<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import {
    startTierUpgrade,
    type UpgradeSource,
  } from '$lib/domains/shared/upgrade/start-tier-upgrade.util.js';
  import type { PostHog } from 'posthog-js';

  type Props = {
    class?: ClassValue;
    children?: Snippet;
    enabled?: boolean;
    source?: UpgradeSource;
    onclick?: () => void;
    interactive?: boolean;
  };
  const {
    class: className = '',
    children,
    enabled = true,
    source = 'unknown',
    onclick: onClick,
    interactive = true,
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
  class={[
    'cursor-pointer',
    className,
    {
      'pointer-events-none': !interactive,
    },
  ]}
  onclick={() => {
    onClick?.();
    if (enabled) {
      startTierUpgrade(posthog, source);
    }
  }}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  role="button"
>
  {@render children?.()}
</div>
