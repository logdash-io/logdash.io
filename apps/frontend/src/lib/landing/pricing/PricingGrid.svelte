<script lang="ts">
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import ShieldCheckIcon from '$lib/domains/shared/icons/ShieldCheckIcon.svelte';
  import { fade } from 'svelte/transition';
  import { runGithubLogin } from './run-github-login.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  let loggingIn = $state(false);

  const handleGithubLogin = async (tier: UserTier) => {
    loggingIn = true;

    try {
      await runGithubLogin(tier);
    } catch (error) {
      loggingIn = false;
      console.error(error);
    }
  };

  const pricingData = {
    plans: PAYMENT_PLANS,
    footer: {
      title: "Questions? We're here to help",
      description: 'Contact us for any questions about our pricing or features',
    },
  };
</script>

<div class="mx-auto mb-8 grid max-w-landing gap-8 md:grid-cols-3">
  {#each pricingData.plans as plan (plan.tier)}
    <div class="relative flex flex-col">
      <div class="h-10"></div>

      <div
        class={[
          'card ld-card-base relative overflow-visible rounded-3xl p-8',
          {
            'border-primary': plan.popular,
          },
        ]}
      >
        {#if plan.popular}
          <span
            class="badge badge-primary absolute -top-3 left-1/2 -translate-x-1/2 font-semibold"
          >
            Most popular
          </span>
        {/if}

        <div class={['badge badge-soft badge-lg mb-4', plan.badge.class]}>
          {plan.badge.text}
        </div>

        <div class="card-body p-0">
          <h2 class="card-title text-2xl font-normal">
            {plan.name}
          </h2>
          <div class="mt-2">
            <span class="text-4xl font-semibold">{plan.price}</span>

            <p class="text-neutral-300 mt-4 h-10 text-sm">
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
            {#each plan.features as feature (feature.name)}
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
      {#each pricingData.plans as plan (plan.tier)}
        <div>
          <span class="text-primary font-medium">{plan.name}:</span>
          <span class="text-base-content">{plan.tldr}</span>
        </div>
      {/each}
    </div>
  {/snippet}

  <div class="flex items-center justify-center text-sm">
    <Tooltip interactive={true} {content} placement="top">
      <span class="text-primary cursor-help underline font-medium">tldr</span>
    </Tooltip>
  </div>
</div>
