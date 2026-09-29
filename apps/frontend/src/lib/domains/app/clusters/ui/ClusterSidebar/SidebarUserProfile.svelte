<script lang="ts">
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { resolve } from '$app/paths';
  import { logout } from '$lib/domains/auth/application/logout.js';
  import UserIcon from '$lib/domains/shared/icons/UserIcon.svelte';
  import FeedbackButton from '$lib/domains/shared/ui/components/FeedbackButton.svelte';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { Menu, Tooltip } from '@logdash/hyper-ui/presentational';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import LogoutIcon from '$lib/domains/shared/icons/LogoutIcon.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';

  const posthog = getContext<PostHog>('posthog');

  async function onLogout(): Promise<void> {
    posthog.reset();

    try {
      await logout();
    } catch {
      toast.error('Failed to log out');
    }
  }

  const accountName = $derived(
    userState.isAnonymous ? 'Anonymous' : userState.user?.email || 'Account',
  );
  const planLabel = $derived(capitalize(userState.tier.replaceAll('-', ' ')));

  function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
</script>

<div class="flex items-center gap-1 px-3 pt-4 pb-3">
  <Tooltip
    class="min-w-0 flex-1"
    content={userProfileMenu}
    interactive={true}
    placement="top"
    align="left"
    trigger="click"
    closeOnOutsideTooltipClick={true}
  >
    <button
      class="hover:bg-surface-hover flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 text-left"
    >
      <span
        class="bg-surface-150 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full"
      >
        {#if userState.avatar}
          <img class="size-full object-cover" src={userState.avatar} alt="" />
        {:else}
          <UserIcon class="text-neutral-300 size-3.5" />
        {/if}
      </span>
      <span class="truncate text-[13px]">{accountName}</span>
    </button>
  </Tooltip>

  <FeedbackButton />

  <span
    class="border-border-default text-neutral-400 flex h-6 shrink-0 items-center rounded-full border px-2 text-xs"
  >
    {planLabel}
  </span>
</div>

{#snippet userProfileMenu(close: () => void)}
  <Menu class="ld-card-base z-1 w-56 rounded-xl">
    {#if userState.canUpgrade}
      <UpgradeButton
        class="mb-1"
        source="nav-menu"
        onclick={() => {
          close();
        }}
      />
    {/if}

    <li>
      <a
        href={resolve('/app/account/api-keys')}
        class="flex w-full items-center gap-3 rounded-lg"
        onclick={close}
      >
        <KeyIcon class="inline h-4 w-4" />
        API keys
      </a>
    </li>

    {#if userState.hasBilling}
      <li>
        <a
          href={resolve('/app/api/user/billing')}
          class="flex w-full items-center gap-3 rounded-lg"
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
        onclick={onLogout}
      >
        <LogoutIcon class="inline h-4 w-4" />
        Logout
      </button>
    </li>
  </Menu>
{/snippet}
