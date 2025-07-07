<script lang="ts">
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import { generateGithubOAuthUrl } from '$lib/domains/shared/utils/generate-github-oauth-url.js';
  import { CheckIcon, ShieldCheckIcon, XIcon } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import SkyBackground from '$lib/domains/shared/upgrade/SkyBackground.svelte';
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';

  let loggingIn = $state(false);

  function handleGithubLogin() {
    loggingIn = true;
    window.location.href = generateGithubOAuthUrl({
      terms_accepted: false,
      email_accepted: false,
      flow: 'login',
      fallback_url: `/app/auth?needs_account=true`,
      tier: UserTier.BUILDER,
      next_url: '/app/clusters',
    });
  }

  const builderPlan = PAYMENT_PLANS.find(
    (plan) => plan.tier === UserTier.BUILDER,
  );
</script>

{#if upgradeState.modalOpen}
  <!-- Modal backdrop -->
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
      class="bg-base-300 relative h-fit max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl"
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
        <XIcon class="h-4 w-4" />
      </button>

      <div class="flex h-full">
        <div class="relative flex-1 overflow-hidden">
          <SkyBackground density={1} />

          <div
            class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white"
          >
            <h1 class="mb-6 text-4xl font-bold">Ready to level up?</h1>
            <p class="mb-8 text-xl opacity-90">
              Join the Builder plan and unlock even more potential of Logdash
            </p>
            <div class="space-y-4 text-lg">
              <div class="flex items-center gap-3">
                <CheckIcon class="text-success h-6 w-6" />
                <span>Priority support & feature requests</span>
              </div>
              <div class="flex items-center gap-3">
                <CheckIcon class="text-success h-6 w-6" />
                <span>Extended data retention & granularity</span>
              </div>
              <div class="flex items-center gap-3">
                <CheckIcon class="text-success h-6 w-6" />
                <span>Early access to new features</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ld-card-base flex flex-1 flex-col overflow-y-auto p-8">
          <div class="mx-auto w-full max-w-md">
            <div class="relative mb-6">
              <div
                class="badge badge-primary badge-soft absolute top-0 right-0 font-semibold"
              >
                {builderPlan.badge.text}
              </div>
              <h2 class="text-secondary mb-2 text-3xl font-bold">
                {builderPlan.name}
              </h2>
              <div class="mb-4">
                <span class="text-5xl font-bold">{builderPlan.price}</span>
              </div>
              <p class="text-base opacity-75">
                {builderPlan.description}
              </p>
            </div>

            <button
              onclick={() => handleGithubLogin()}
              disabled={loggingIn || builderPlan['disabled']}
              class={`btn btn-lg mb-6 w-full rounded-full font-medium ${builderPlan.popular ? 'btn-primary' : 'btn-secondary'}`}
            >
              {#if loggingIn}
                <div
                  in:fade={{ duration: 150 }}
                  class="flex h-6 w-6 items-center justify-center"
                >
                  <span class="loading loading-spinner h-4 w-4"></span>
                </div>
              {/if}

              {builderPlan.buttonText}
            </button>

            <div class="mb-4 flex items-center gap-2 text-base font-semibold">
              <ShieldCheckIcon class="text-success h-6 w-6" />
              {builderPlan.guarantee}
            </div>

            <div class="mb-8 flex-1">
              <ul class="space-y-3">
                {#each builderPlan.features as feature}
                  <li class="flex items-start gap-3">
                    <CheckIcon
                      class="text-success mt-0.5 h-5 w-5 flex-shrink-0"
                    />

                    <span>
                      {feature.name}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>

            <!-- Action button -->
            <div class="mt-auto">
              <p class=" text-center text-xs opacity-75">
                30-day trial. Full refund if you cancel within 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
