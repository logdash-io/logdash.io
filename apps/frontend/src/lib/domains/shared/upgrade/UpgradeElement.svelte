<script lang="ts">
  import { getContext, onDestroy, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import type { UpgradeSource } from '$lib/domains/shared/upgrade/start-tier-upgrade.util.js';
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

  const onMouseEnter = (): void => {
    if (enabled) {
      upgradeState.showBackground();
    }
  };

  const onMouseLeave = (): void => {
    if (enabled) {
      upgradeState.hideBackground();
    }
  };

  const onElementClick = (): void => {
    onClick?.();
    if (enabled) {
      posthog?.capture('upgrade_button_clicked', {
        source,
        timestamp: new Date().toISOString(),
      });
      upgradeState.openModal(source);
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
  onclick={onElementClick}
  onmouseenter={onMouseEnter}
  onmouseleave={onMouseLeave}
  role="button"
>
  {@render children?.()}
</div>
