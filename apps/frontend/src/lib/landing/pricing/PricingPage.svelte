<script lang="ts">
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import {
    ArrowDownIcon,
    ArrowRightIcon,
    CheckIcon,
    ShieldCheckIcon,
  } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import PricingComparisonTable from './PricingComparisonTable.svelte';
  import { runGithubLogin } from './run-github-login.js';
  import TrustProof from '../TrustProof.svelte';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';

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

<section class="my-16 px-4">
  <div class="mx-auto max-w-4xl text-center">
    <TrustProof
      align="center"
      quote="Working with Logdash is like having an extra team on our side. It works out of the box, and anytime I share feedback, they're already on it. Real people, real support, and impressively fast."
      person="Yaroslaw Korshak"
      img="/images/testimonials/yaroslaw.png"
      company={{
        who: 'CEO',
        name: 'Resurgo.ai',
        url: 'https://resurgo.ai',
      }}
    />
  </div>
</section>

<section class="px-4">
  <div class="mx-auto mb-8 grid max-w-7xl gap-8 md:grid-cols-3">
    {#each pricingData.plans as plan}
      <div class="relative flex flex-col">
        {#if plan.popular}
          <div
            class="bg-primary ring-primary flex h-16 w-full items-center justify-center rounded-xl pb-6 text-sm font-semibold ring"
          >
            Most Popular
          </div>
        {:else}
          <div class="h-16"></div>
        {/if}

        <div
          class={[
            'card ld-card-base relative -mt-6 overflow-visible rounded-xl p-8 shadow-xl',
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

              <p class="mt-4 text-sm opacity-75">
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

  <span class="badge badge-soft mx-auto mb-8 block opacity-80">
    Plans are in beta and subject to change
  </span>

  <a
    href="#detailed-plans-comparison"
    class="btn btn-primary text-base-content btn-outline mx-auto my-12 flex w-fit items-center gap-2 rounded-full font-normal"
  >
    Compare plans
    <ArrowRightIcon class="size-4" />
  </a>

  <div
    class="ld-card-base bg-neutral text-neutral-content mx-auto max-w-2xl rounded-xl p-8 shadow-xl"
  >
    <p class="mb-2 text-xs font-semibold uppercase tracking-wide opacity-80">
      A Note from us
    </p>
    <p class="mb-6 text-lg font-extrabold">Logdash Inc.</p>

    <p class="mb-4 opacity-90">
      Our pricing is designed to let you explore all of the Logdash features and
      capabilities without paying a dime.
    </p>

    <p class="mb-4 opacity-90">
      We believe that the best way to help with your success is to give you
      access to everything we have to offer, even before you decide to upgrade.
    </p>

    <p class="mb-4 opacity-90">
      Focus on building your awesome projects; your access to all features is
      only limited by fair resource usage on our side.
    </p>

    <p class="mb-6 opacity-90">
      We're committed to transparency and fairness as we grow. Thanks for
      joining our journey!
    </p>

    <div
      class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8"
    >
      <div class="flex items-center gap-4">
        <img
          src="/images/founders/olo.webp"
          alt="Aleksander Blaszkiewicz"
          class="h-12 w-12 rounded-full"
        />
        <div class="text-left">
          <p class="font-medium">Aleksander Blaszkiewicz</p>
          <p class="text-sm opacity-75">Co-founder</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <img
          src="/images/founders/simon.webp"
          alt="Simon Gracki"
          class="h-12 w-12 rounded-full"
        />
        <div class="text-left">
          <p class="font-medium">Simon Gracki</p>
          <p class="text-sm opacity-75">Co-founder</p>
        </div>
      </div>
    </div>
  </div>

  <div class="distance h-8 md:h-16"></div>

  <PricingComparisonTable />
</section>
