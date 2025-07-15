<script lang="ts">
  import { getContext, onDestroy, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import type { UpgradeSource } from '$lib/domains/shared/upgrade/start-tier-upgrade.util.js';
  import type { PostHog } from 'posthog-js';
  import { userState } from '../user/application/user.state.svelte.js';

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

  onDestroy(() => {
    upgradeState.hideBackground();
  });
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
      const nextTier = userState.upgrade(source);
      if (nextTier) {
        posthog.capture('upgrade_initiated', {
          source,
          timestamp: new Date().toISOString(),
          tier: nextTier,
        });
      }
    }
  }}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  role="button"
>
  {@render children?.()}
</div>
