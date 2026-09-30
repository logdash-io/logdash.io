<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
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

  const CONTROLS =
    'a[href], button, input, select, textarea, [tabindex], [contenteditable]';

  const posthog = getContext<PostHog>('posthog');

  let wrapsControl = $state(false);

  const buttonAttributes = $derived(
    !wrapsControl && (enabled || onClick !== undefined)
      ? {
          role: 'button',
          tabindex: interactive ? 0 : -1,
          'aria-disabled': !interactive || undefined,
          onkeydown: onElementKeydown,
        }
      : {},
  );

  function onElementClick(): void {
    if (!interactive) {
      return;
    }

    onClick?.();
    if (enabled) {
      posthog?.capture('upgrade_button_clicked', {
        source,
        timestamp: new Date().toISOString(),
      });
      upgradeState.openModal(source);
    }
  }

  function onElementKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onElementClick();
  }

  function detectControl(node: HTMLElement): void {
    wrapsControl = node.querySelector(CONTROLS) !== null;
  }
</script>

<div
  {@attach detectControl}
  class={[
    'cursor-pointer',
    className,
    {
      'pointer-events-none': !interactive,
    },
  ]}
  onclick={onElementClick}
  {...buttonAttributes}
>
  {@render children?.()}
</div>
