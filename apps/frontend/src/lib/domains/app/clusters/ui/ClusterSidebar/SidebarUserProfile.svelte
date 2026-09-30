<script lang="ts">
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { resolve } from '$app/paths';
  import { logout } from '$lib/domains/auth/application/logout.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { Menu } from '@logdash/hyper-ui/presentational';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import LogoutIcon from '$lib/domains/shared/icons/LogoutIcon.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';
  import SidebarAccountRow from './SidebarAccountRow.svelte';

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

<SidebarAccountRow
  name={accountName}
  plan={planLabel}
  avatar={userState.avatar}
  menu={userProfileMenu}
/>

{#snippet userProfileMenu(close: () => void)}
  <Menu class="ld-card-base z-1 w-56 rounded-xl">
    {#if userState.canUpgrade}
      <li>
        <UpgradeButton
          class="mb-1 w-full"
          source="nav-menu"
          onclick={() => {
            close();
          }}
        />
      </li>
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
