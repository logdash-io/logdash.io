<script lang="ts">
  import { goto } from '$app/navigation';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { ExternalLinkIcon, LogOutIcon } from 'lucide-svelte';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';

  const posthog = getContext<PostHog>('posthog');
</script>

{#snippet menu()}
  <ul
    tabindex="0"
    class="menu dropdown-content ld-card-base rounded-box z-1 p-2 shadow"
  >
    {#if userState.canUpgrade}
      <UpgradeButton class="mb-1" source="nav-menu" />
    {/if}

    {#if userState.hasBilling}
      <li>
        <a
          class="flex w-full items-center justify-between gap-3"
          onclick={() => {
            goto('/app/api/user/billing');
          }}
        >
          Billing
          <ExternalLinkIcon class="inline h-4 w-4" />
        </a>
      </li>
    {/if}

    <li>
      <a
        class="flex w-full items-center justify-between gap-3"
        onclick={() => {
          posthog.reset();
        }}
        href={RoutePath.LOGOUT}
      >
        Logout
        <LogOutIcon class="inline h-4 w-4" />
      </a>
    </li>
  </ul>
{/snippet}

<Tooltip align="right" content={menu} interactive={true} placement="bottom">
  <div class="btn btn-ghost btn-circle" role="button" tabindex="0">
    <div class="indicator">
      <span
        class={[
          'indicator-item indicator-bottom badge-soft indicator-center badge badge-xs',
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

      <div
        class={[
          'avatar',
          {
            'avatar-placeholder': !userState.avatar,
          },
        ]}
      >
        <div class="bg-base-100 w-8 rounded-full">
          {#if userState.avatar}
            <img src={userState.avatar} />
          {:else}
            <span class="text-lg">A</span>
          {/if}
        </div>
      </div>
    </div>
  </div>
</Tooltip>
