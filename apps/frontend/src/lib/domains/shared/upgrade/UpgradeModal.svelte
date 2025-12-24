<script lang="ts">
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import { CheckIcon, CloseIcon } from '@logdash/hyper-ui/icons';
  import ShieldCheckIcon from '$lib/domains/shared/icons/ShieldCheckIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { fade, scale } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { match } from 'ts-pattern';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';

  const posthog = getContext<PostHog>('posthog');
  let upgrading = $state(false);

  const TIER_ORDER = [UserTier.FREE, UserTier.BUILDER, UserTier.PRO];

  const getDisplayTier = (tier: UserTier): UserTier => {
    return match(tier)
      .with(UserTier.EARLY_USER, () => UserTier.FREE)
      .with(UserTier.CONTRIBUTOR, () => UserTier.FREE)
      .with(UserTier.EARLY_BIRD, () => UserTier.FREE)
      .otherwise(() => tier);
  };

  const currentDisplayTier = $derived(getDisplayTier(userState.tier));

  const isCurrentPlan = (planTier: UserTier): boolean => {
    return planTier === currentDisplayTier;
  };

  const canUpgradeTo = (planTier: UserTier): boolean => {
    const currentIndex = TIER_ORDER.indexOf(currentDisplayTier);
    const targetIndex = TIER_ORDER.indexOf(planTier);
    return targetIndex > currentIndex;
  };

  const getButtonText = (plan: (typeof PAYMENT_PLANS)[number]): string => {
    if (isCurrentPlan(plan.tier)) {
      return 'Current Plan';
    }
    if (canUpgradeTo(plan.tier)) {
      return `Upgrade to ${plan.name}`;
    }
    return plan.buttonText;
  };

  const isButtonDisabled = (plan: (typeof PAYMENT_PLANS)[number]): boolean => {
    return upgrading || isCurrentPlan(plan.tier) || !canUpgradeTo(plan.tier);
  };

  const onSelectPlan = (tier: UserTier): void => {
    if (!canUpgradeTo(tier)) {
      return;
    }

    upgrading = true;
    const source = upgradeState.source;

    posthog?.capture('upgrade_plan_selected', {
      source,
      timestamp: new Date().toISOString(),
      tier,
    });

    userState.upgrade(source, tier);
  };

  const onMouseEnter = (tier: UserTier): void => {
    if (tier === UserTier.PRO) {
      upgradeState.showBackground();
    }
  };

  const onMouseLeave = (tier: UserTier): void => {
    if (tier === UserTier.PRO) {
      upgradeState.hideBackground();
    }
  };
</script>

{#if upgradeState.modalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    transition:fade={{ duration: 200 }}
    onclick={(e) => {
      if (e.target === e.currentTarget) {
        upgradeState.hideModal();
      }
    }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="upgrade-modal-title"
  >
    <div
      class="ld-card-base ld-card-rounding relative h-fit max-h-[90dvh] w-full max-w-5xl overflow-y-auto p-8"
      transition:scale={{
        duration: 150,
        easing: cubicInOut,
        start: 0.95,
      }}
    >
      <button
        class="btn btn-circle btn-ghost btn-sm absolute top-4 right-4 z-10"
        onclick={() => upgradeState.hideModal()}
        aria-label="Close modal"
      >
        <CloseIcon class="h-4 w-4" />
      </button>

      <div class="mb-8 text-center">
        <h1 id="upgrade-modal-title" class="mb-2 text-3xl font-semibold">
          Upgrade your plan
        </h1>
        <p class="opacity-75">Get the one that fits your needs best</p>
      </div>

      <div class="grid gap-6 md:grid-cols-3">
        {#each PAYMENT_PLANS as plan}
          <div class="relative flex flex-col">
            {#if plan.popular}
              <div
                class="bg-primary ring-primary -mb-1.5 flex h-16 w-full items-center justify-center rounded-t-3xl pb-8 text-sm font-semibold ring"
              >
                Most popular
              </div>
            {:else}
              <div class="h-15"></div>
            {/if}

            <div
              class={[
                'card ld-card-bg ring relative -mt-6 flex flex-1 flex-col overflow-visible ld-card-rounding p-6',
                {
                  'ring-primary': plan.popular,
                  'ring-success/40': isCurrentPlan(plan.tier),
                  'ring-base-100': !plan.popular && !isCurrentPlan(plan.tier),
                },
              ]}
              onmouseenter={() => onMouseEnter(plan.tier)}
              onmouseleave={() => onMouseLeave(plan.tier)}
            >
              {#if isCurrentPlan(plan.tier)}
                <div
                  class="badge badge-success badge-soft absolute -top-3 left-1/2 -translate-x-1/2 font-semibold"
                >
                  Current Plan
                </div>
              {/if}

              <div class={['badge badge-soft mb-3', plan.badge.class]}>
                {plan.badge.text}
              </div>

              <div class="card-body flex-1 p-0">
                <h2 class="card-title text-xl font-normal">
                  {plan.name}
                </h2>
                <div class="mt-2">
                  <span class="text-3xl font-semibold">{plan.price}</span>

                  <p class="mt-3 h-10 text-sm opacity-75">
                    {plan.description}
                  </p>
                </div>

                <div class="card-actions my-4 justify-center">
                  <button
                    onclick={() => onSelectPlan(plan.tier)}
                    disabled={isButtonDisabled(plan)}
                    class={[
                      'btn w-full rounded-full font-medium',
                      {
                        'btn-primary': plan.popular && canUpgradeTo(plan.tier),
                        'btn-secondary':
                          !plan.popular && canUpgradeTo(plan.tier),
                        'btn-disabled': isButtonDisabled(plan),
                      },
                    ]}
                  >
                    {#if upgrading && canUpgradeTo(plan.tier)}
                      <div
                        in:fade={{ duration: 150 }}
                        class="flex h-5 w-5 items-center justify-center"
                      >
                        <span class="loading loading-spinner h-4 w-4"></span>
                      </div>
                    {/if}

                    {getButtonText(plan)}
                  </button>
                </div>

                <div class="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheckIcon class="text-success h-5 w-5" />
                  {plan.guarantee}
                </div>

                <ul class="space-y-2 text-sm">
                  {#each plan.features.slice(0, 6) as feature}
                    <li class="flex items-center gap-2">
                      <CheckIcon class="text-success h-4 w-4 flex-shrink-0" />
                      <span>{feature.name}</span>
                    </li>
                  {/each}
                  {#if plan.features.length > 6}
                    {@const remainingFeatures = plan.features.slice(6)}
                    {#snippet tooltipContent()}
                      <ul class="space-y-1.5 p-1 ld-card">
                        {#each remainingFeatures as feature}
                          <li class="flex items-center gap-2">
                            <CheckIcon
                              class="text-success size-4 flex-shrink-0"
                            />
                            <span>{feature.name}</span>
                          </li>
                        {/each}
                      </ul>
                    {/snippet}
                    <li>
                      <Tooltip content={tooltipContent} placement="top">
                        <span
                          class="text-primary cursor-help text-xs underline decoration-dotted"
                        >
                          +{remainingFeatures.length} more features
                        </span>
                      </Tooltip>
                    </li>
                  {/if}
                </ul>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-6 text-center">
        <p class="text-xs opacity-75">
          30-day trial. Full refund if you cancel within 30 days.
        </p>
      </div>
    </div>
  </div>
{/if}
