<script lang="ts">
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { CheckIcon, ShieldCheckIcon } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { runGithubLogin } from './run-github-login.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  let loggingIn = $state(false);

  const handleGithubLogin = (tier: UserTier) => {
    loggingIn = true;
    runGithubLogin(tier);
  };

  const pricingData = {
    plans: PAYMENT_PLANS,
    footer: {
      title: "Questions? We're here to help",
      description: 'Contact us for any questions about our pricing or features',
    },
  };

  const onMouseEnter = (plan: any) => {
    if (plan.tier === UserTier.PRO) {
      upgradeState.showBackground();
    }
  };

  const onMouseLeave = (plan: any) => {
    if (plan.tier === UserTier.PRO) {
      upgradeState.hideBackground();
    }
  };
</script>

<div class="mx-auto mb-8 grid max-w-7xl gap-8 md:grid-cols-3">
  {#each pricingData.plans as plan}
    <div class="relative flex flex-col">
      {#if plan.popular}
        <div
          class="bg-primary ring-primary flex h-20 w-full items-center justify-center rounded-t-3xl pb-10 -mb-4 text-sm font-semibold ring"
        >
          Most popular
        </div>
      {:else}
        <div class="h-16"></div>
      {/if}

      <div
        class={[
          'card ld-card-base relative -mt-6 overflow-visible rounded-3xl p-8 shadow-xl',
          {
            'ring-primary ring': plan.popular,
          },
        ]}
        onmouseenter={() => onMouseEnter(plan)}
        onmouseleave={() => onMouseLeave(plan)}
      >
        <div class={['badge badge-soft badge-lg mb-4', plan.badge.class]}>
          {plan.badge.text}
        </div>

        <div class="card-body p-0">
          <h2 class="card-title text-2xl font-normal">
            {plan.name}
          </h2>
          <div class="mt-2">
            <span class="text-4xl font-semibold">{plan.price}</span>

            <p class="mt-4 text-sm opacity-75 h-10">
              {plan.description}
            </p>
          </div>

          <div class="card-actions my-4 justify-center">
            <button
              onclick={() => handleGithubLogin(plan.tier)}
              disabled={loggingIn || plan['disabled']}
              class={`btn btn-lg w-full rounded-full font-medium ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
            >
              {#if loggingIn}
                <div
                  in:fade={{ duration: 150 }}
                  class="flex h-6 w-6 items-center justify-center"
                >
                  <span class="loading loading-spinner h-4 w-4"></span>
                </div>
              {/if}

              {plan.buttonText}
            </button>
          </div>

          <div class="mb-4 flex items-center gap-2 text-base font-semibold">
            <ShieldCheckIcon class="text-success h-6 w-6" />
            {plan.guarantee}
          </div>

          <ul class="mb-8 space-y-3 text-base">
            {#each plan.features as feature}
              <li class="flex items-center gap-3">
                <CheckIcon class="text-success h-5 w-5 flex-shrink-0" />

                <span>
                  {feature.name}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/each}
</div>

<div class="mx-auto max-w-5xl mt-8">
  {#snippet content()}
    <div class="flex flex-col gap-3 p-2 max-w-sm ld-card">
      {#each pricingData.plans as plan}
        <div>
          <span class="text-primary font-medium">{plan.name}:</span>
          <span class="text-base-content">{plan.tldr}</span>
        </div>
      {/each}
    </div>
  {/snippet}

  <div class="flex items-center justify-center text-sm">
    <Tooltip {content} placement="top">
      <span class="text-primary cursor-help underline font-medium">tldr</span>
    </Tooltip>
  </div>
</div>
