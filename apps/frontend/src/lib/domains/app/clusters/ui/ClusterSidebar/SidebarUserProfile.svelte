<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { logout } from '$lib/domains/auth/application/logout.js';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import LogoutIcon from '$lib/domains/shared/icons/LogoutIcon.svelte';
  import { UserRoundIcon } from 'lucide-svelte';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';

  const posthog = getContext<PostHog>('posthog');

  const accountName = $derived(
    userState.isAnonymous ? 'Anonymous' : userState.user?.email || 'Account',
  );
  const planLabel = $derived(
    `${capitalize(userState.tier.replaceAll('-', ' '))} plan`,
  );

  function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
</script>

<Tooltip
  class="w-full"
  content={userProfileMenu}
  interactive={true}
  placement="right"
  align="bottom"
  trigger="click"
  closeOnOutsideTooltipClick={true}
>
  <button
    class="hover:bg-surface-root-hover flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left"
  >
    <span
      class="bg-base-100 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
    >
      {#if userState.avatar}
        <img class="size-full object-cover" src={userState.avatar} alt="" />
      {:else}
        <UserRoundIcon class="text-neutral-400 size-3.5" />
      {/if}
    </span>

    <span class="flex min-w-0 flex-1 flex-col">
      <span class="truncate text-sm font-medium">{accountName}</span>
      <span class="text-neutral-500 text-xs">{planLabel}</span>
    </span>

    <ChevronRightIcon class="text-neutral-600 size-3.5 shrink-0" />
  </button>
</Tooltip>

{#snippet userProfileMenu(close: () => void)}
  <ul class="menu dropdown-content ld-card-base z-1 w-56 rounded-xl p-1.5">
    {#if userState.canUpgrade}
      <UpgradeButton
        class="mb-1"
        source="nav-menu"
        onclick={() => {
          close();
        }}
      />
    {/if}

    {#if userState.hasBilling}
      <li>
        <a
          class="flex w-full items-center gap-3 rounded-lg"
          onclick={() => {
            goto(resolve('/app/api/user/billing'));
          }}
        >
          <OpenIcon class="inline h-4 w-4" />
          Billing
        </a>
      </li>
    {/if}

    <li>
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-lg"
        onclick={() => {
          posthog.reset();
          logout();
        }}
      >
        <LogoutIcon class="inline h-4 w-4" />
        Logout
      </button>
    </li>
  </ul>
{/snippet}
