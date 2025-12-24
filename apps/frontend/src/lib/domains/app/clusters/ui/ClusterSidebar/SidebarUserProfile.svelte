<script lang="ts">
  import { goto } from '$app/navigation';
  import { proSkyBackgroundState } from '$lib/domains/shared/pro-features/pro-sky-background.state.svelte.js';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import LogoutIcon from '$lib/domains/shared/icons/LogoutIcon.svelte';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';

  const posthog = getContext<PostHog>('posthog');
</script>

<div class="mt-auto p-1">
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
      class="flex w-full items-center gap-3 rounded-2xl px-2 py-2 hover:bg-base-100 cursor-pointer"
    >
      <div
        class={[
          'avatar',
          {
            'avatar-placeholder': !userState.avatar,
          },
        ]}
      >
        <div class="bg-base-200 w-8 rounded-full">
          {#if userState.avatar}
            <img src={userState.avatar} alt="User avatar" />
          {:else}
            <span class="text-sm">A</span>
          {/if}
        </div>
      </div>
      <div class="flex flex-1 flex-col items-start overflow-hidden">
        <span class="truncate text-sm font-medium">
          {userState.user?.email || 'Account'}
        </span>
        <span
          class={[
            'badge badge-xs badge-soft',
            {
              'badge-primary':
                userState.isPaid && userState.tier !== UserTier.CONTRIBUTOR,
              'badge-secondary': userState.isFree,
              'badge-warning': userState.tier === UserTier.CONTRIBUTOR,
            },
          ]}
        >
          {userState.tier.replaceAll('-', ' ')}
        </span>
      </div>
      <ChevronRightIcon class="size-4 text-base-content/50" />
    </button>
  </Tooltip>
</div>

{#snippet userProfileMenu(close: () => void)}
  <ul class="menu dropdown-content ld-card-base rounded-2xl z-1 w-56 p-2">
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
          class="flex w-full items-center gap-3 rounded-xl"
          onclick={() => {
            goto('/app/api/user/billing');
          }}
        >
          <OpenIcon class="inline h-4 w-4" />
          Billing
        </a>
      </li>
    {/if}

    {#if userState.isPro}
      <li>
        <label class="flex w-full cursor-pointer items-center gap-3 rounded-xl">
          <input
            type="checkbox"
            class="checkbox checkbox-xs checkbox-primary"
            checked={proSkyBackgroundState.enabled}
            onchange={() => {
              proSkyBackgroundState.toggle();
            }}
          />
          <span>Sky Background</span>
        </label>
      </li>
    {/if}

    <li>
      <a
        class="flex w-full items-center gap-3 rounded-xl"
        onclick={() => {
          posthog.reset();
        }}
        href={RoutePath.LOGOUT}
      >
        <LogoutIcon class="inline h-4 w-4" />
        Logout
      </a>
    </li>
  </ul>
{/snippet}
