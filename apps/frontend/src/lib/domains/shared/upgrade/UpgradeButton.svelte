<script lang="ts">
  import { type UpgradeSource } from '$lib/domains/shared/upgrade/start-tier-upgrade.util.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import RocketIcon from '$lib/domains/shared/icons/RocketIcon.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { getContext, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import type { PostHog } from 'posthog-js';

  type Props = {
    variant?: 'secondary' | 'neutral';
    class?: ClassValue;
    children?: Snippet;
    source?: UpgradeSource;
    onclick?: () => void;
  };
  const {
    variant = 'secondary',
    class: className = '',
    children,
    source = 'unknown',
    onclick: onClickProp,
  }: Props = $props();

  const posthog = getContext<PostHog>('posthog');

  const onClick = (): void => {
    onClickProp?.();
    posthog?.capture('upgrade_button_clicked', {
      source,
      timestamp: new Date().toISOString(),
    });
    upgradeState.openModal(source);
  };
</script>

<Button {variant} size="sm" class={className} onclick={onClick}>
  <RocketIcon class="size-4 shrink-0" />
  {#if children}
    {@render children()}
  {:else}
    Upgrade your plan
  {/if}
</Button>
