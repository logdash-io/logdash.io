<script lang="ts">
  import { type UpgradeSource } from '$lib/domains/shared/upgrade/start-tier-upgrade.util.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import RocketIcon from '$lib/domains/shared/icons/RocketIcon.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    class?: ClassValue;
    children?: Snippet;
    source?: UpgradeSource;
    onclick?: () => void;
  };
  const {
    class: className = '',
    children,
    source = 'unknown',
    onclick: onClickProp,
  }: Props = $props();

  const onClick = (): void => {
    onClickProp?.();
    window.logdash?.track('upgrade_button_clicked');
    upgradeState.openModal(source);
  };
</script>

<Button size="sm" class={className} onclick={onClick}>
  <RocketIcon class="size-4 shrink-0" />
  {#if children}
    {@render children()}
  {:else}
    Upgrade your plan
  {/if}
</Button>
