<script lang="ts">
  import { upgradeState } from './upgrade.state.svelte.js';
  import { UserTier } from '$lib/shared/types.js';
  import { generateGithubOAuthUrl } from '$lib/shared/utils/generate-github-oauth-url.js';
  import { CheckIcon, XIcon } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import SkyBackground from './SkyBackground.svelte';
  import { PAYMENT_PLANS } from '../payment-plans.const.js';

  let loggingIn = $state(false);

  function handleGithubLogin() {
    loggingIn = true;
    window.location.href = generateGithubOAuthUrl({
      terms_accepted: false,
      email_accepted: false,
      flow: 'login',
      fallback_url: `/app/auth?needs_account=true`,
      tier: UserTier.EARLY_BIRD,
      next_url: '/app/clusters',
    });
  }

  const earlyBirdPlan = PAYMENT_PLANS.find(
    (plan) => plan.tier === UserTier.EARLY_BIRD,
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
        class="btn btn-circle btn-ghost btn-sm absolute right-4 top-4 z-10"
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
              Join our early adopters and unlock the full potential of Logdash
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

        <!-- Right half - Early Bird Plan -->
        <div class="ld-card-base flex flex-1 flex-col overflow-y-auto p-8">
          <div class="mx-auto w-full max-w-md">
            <!-- Plan header -->
            <div class="relative mb-6">
              <div
                class="badge badge-primary badge-soft absolute right-0 top-0 font-semibold"
              >
                {earlyBirdPlan.badge.text}
              </div>
              <h2 class="text-secondary mb-2 text-3xl font-bold">
                {earlyBirdPlan.name}
              </h2>
              <div class="mb-4">
                <span class="text-5xl font-bold">{earlyBirdPlan.price}</span>
                <!-- <span class="text-lg opacity-75">
                  {earlyBirdPlan.period}
                </span> -->
              </div>
              <p class="text-base opacity-75">
                {earlyBirdPlan.description}
              </p>
            </div>

            <!-- Divider -->
            <div class="divider"></div>

            <!-- Features list -->
            <div class="mb-8 flex-1">
              <ul class="space-y-3">
                {#each earlyBirdPlan.features as feature}
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
              <button
                onclick={handleGithubLogin}
                disabled={loggingIn}
                class="btn btn-primary btn-lg w-full"
              >
                {#if loggingIn}
                  <div
                    in:fade={{ duration: 150 }}
                    class="flex h-6 w-6 items-center justify-center"
                  >
                    <span class="loading loading-spinner h-5 w-5"></span>
                  </div>
                {/if}
                Upgrade to {earlyBirdPlan.name}
              </button>

              <!-- Trial info -->
              <p class="mt-4 text-center text-xs opacity-75">
                30-day trial. Full refund if you cancel within 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
