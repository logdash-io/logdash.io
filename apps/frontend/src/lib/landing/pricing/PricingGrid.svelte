<script lang="ts">
  import CheckIcon from '$lib/domains/shared/icons/CheckIcon.svelte';
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import { Button, Spinner } from '@logdash/hyper-ui/presentational';
  import { runGithubLogin } from './run-github-login.js';

  let loggingIn = $state(false);

  const onSelectPlan = async (tier: UserTier): Promise<void> => {
    loggingIn = true;

    try {
      await runGithubLogin(tier);
    } catch (error) {
      loggingIn = false;
      console.error(error);
    }
  };
</script>

<ul class="bg-hairline grid grid-cols-1 gap-px lg:grid-cols-3">
  {#each PAYMENT_PLANS as plan (plan.tier)}
    <li
      class="bg-surface-root flex flex-col px-4 py-10 sm:px-6 lg:px-10 lg:py-12"
    >
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="mr-auto text-lg font-medium tracking-[-0.01em]">
          {plan.name}
        </h2>

        {#if plan.popular}
          <span
            class="bg-surface-inverse text-surface-root rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            Most popular
          </span>
        {/if}

        <span
          class="ring-hairline text-neutral-400 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
        >
          {plan.badge.text}
        </span>
      </div>

      <p
        class="mt-6 text-4xl font-medium tracking-[-0.03em] tabular-nums sm:text-[40px]"
      >
        {plan.price}
      </p>

      <p class="text-neutral-400 mt-3 leading-relaxed text-pretty lg:min-h-13">
        {plan.description}
      </p>

      <Button
        variant={plan.popular ? 'primary' : 'subtle'}
        block
        class="mt-8 h-11 font-medium"
        disabled={loggingIn}
        onclick={() => onSelectPlan(plan.tier)}
      >
        {plan.buttonText}
        {#if loggingIn}
          <Spinner size="xs" aria-hidden="true" />
        {/if}
      </Button>

      <p class="text-neutral-500 mt-3 text-center text-sm">
        {plan.guarantee}
      </p>

      <ul
        class="border-hairline mt-8 flex flex-col gap-3 border-t pt-8 text-sm"
      >
        {#each plan.features as feature (feature.name)}
          {#if feature.name.endsWith(':')}
            <li class="text-neutral-500 font-medium">{feature.name}</li>
          {:else}
            <li class="flex items-start gap-3">
              <CheckIcon class="text-neutral-500 mt-0.5 size-4 shrink-0" />
              <span class="text-neutral-300">{feature.name}</span>
            </li>
          {/if}
        {/each}
      </ul>
    </li>
  {/each}
</ul>
