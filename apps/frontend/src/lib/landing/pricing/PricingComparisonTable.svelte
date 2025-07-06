<script lang="ts">
  import { CheckIcon, MinusIcon, ShieldCheckIcon } from 'lucide-svelte';
  import { FEATURES_COMPARISON } from './feature-comparison.config.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';
  import { fade } from 'svelte/transition';
  import { runGithubLogin } from './run-github-login.js';

  let loggingIn = $state(false);

  const handleGithubLogin = (tier: UserTier) => {
    loggingIn = true;
    runGithubLogin(tier);
  };
</script>

<div
  id="detailed-plans-comparison"
  class="mx-auto hidden max-w-7xl pt-56 md:block"
>
  <div class="-my-56 pb-56">
    <h2 class="mb-16 text-center text-5xl">
      {FEATURES_COMPARISON.title}
    </h2>

    <div class="overflow-x-auto">
      <table
        class="table w-full table-fixed"
        style="border-collapse: separate; border-spacing: 0;"
      >
        <thead>
          <tr class="border-none">
            <th class="text-left font-bold"></th>
            {#each FEATURES_COMPARISON.plans as plan (plan.tier)}
              {@const fullPlanConfig = PAYMENT_PLANS.find(
                (p) => p.tier === plan.tier,
              )}
              <th
                style="border-spacing: 0;"
                class={[
                  'relative h-24 p-0 text-center font-bold',
                  {
                    // 'px-0': plan.tier === UserTier.EARLY_BIRD,
                  },
                ]}
              >
                {#if plan.tier === UserTier.BUILDER}
                  <div
                    class="bg-primary text-secondary top-0 left-0 z-0 -mb-8 flex h-16 w-full items-center justify-center rounded-xl pb-8 text-xs font-semibold"
                  >
                    Most Popular
                  </div>
                {:else}
                  <div class="h-8"></div>
                {/if}

                <div
                  class={[
                    'relative z-10 h-80 p-4 pt-9 text-left',
                    {
                      'border-primary/60 rounded-tl-xl rounded-tr-xl border-t border-r border-l bg-[#210c15]':
                        plan.tier === UserTier.BUILDER,
                      'border-secondary/10 rounded-tl-2xl border border-r-0 border-b-0':
                        plan.tier === UserTier.FREE,
                      'border-secondary/10 rounded-tr-2xl border border-b-0 border-l-0':
                        plan.tier === UserTier.PRO,
                    },
                  ]}
                >
                  <div
                    class={[
                      'badge badge-soft mb-4 ml-2',
                      fullPlanConfig.badge.class,
                    ]}
                  >
                    {fullPlanConfig.badge.text}
                  </div>

                  <div class="card-body p-0 px-4">
                    <h2 class="card-title text-2xl font-normal">
                      {fullPlanConfig.name}
                    </h2>
                    <div class="mt-2">
                      <span class="text-4xl font-semibold">
                        {fullPlanConfig.price}
                      </span>

                      <p class="mt-4 text-sm whitespace-pre-wrap opacity-75">
                        {fullPlanConfig.description.split('.')[0]}
                      </p>
                    </div>

                    <div class="card-actions my-4 justify-center">
                      <button
                        onclick={() => handleGithubLogin(fullPlanConfig.tier)}
                        disabled={loggingIn || fullPlanConfig['disabled']}
                        class={`btn w-full rounded-full font-medium ${fullPlanConfig.popular ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {#if loggingIn}
                          <div
                            in:fade={{ duration: 150 }}
                            class="flex h-6 w-6 items-center justify-center"
                          >
                            <span
                              class="loading loading-spinner h-4 w-4"
                            ></span>
                          </div>
                        {/if}

                        {fullPlanConfig.buttonText}
                      </button>
                    </div>
                  </div>
                  <!-- {plan.name}
                  <br />
                  <span class="text-sm font-normal opacity-75">
                    {plan.price}
                  </span> -->
                </div>
              </th>
            {/each}
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              <div class="flex items-center gap-2">
                <ShieldCheckIcon class="text-success h-6 w-6" />
                30-Day Money Back Guarantee
              </div>
            </td>
            {#each FEATURES_COMPARISON.plans as plan (plan.tier)}
              <td
                class={[
                  'text-center',
                  {
                    'bg-primary/10 border-primary/60 border-r border-l':
                      plan.tier === UserTier.BUILDER,
                    'border-secondary/10 text-secondary/30 border-l':
                      plan.tier === UserTier.FREE,
                    'border-secondary/10 text-secondary/30 border-r':
                      plan.tier === UserTier.PRO,
                  },
                ]}
              >
                <CheckIcon class="text-success mx-auto h-4 w-4" />
              </td>
            {/each}
          </tr>

          {#each FEATURES_COMPARISON.sections as section, parentIndex}
            {@const isLastSection =
              section ===
              FEATURES_COMPARISON.sections[
                FEATURES_COMPARISON.sections.length - 1
              ]}
            {#each section.features as feature, index}
              {@const isLast =
                feature === section.features[section.features.length - 1]}
              {@const isFirstFeature = parentIndex === 0 && index === 0}
              <tr
                class={[
                  {
                    'border-none': isLast,
                  },
                ]}
              >
                <td class="py-4 font-medium">{feature.name}</td>
                <td
                  class={[
                    'border-secondary/10 border-l text-center',
                    {
                      'rounded-b-xl border-b': isLastSection && isLast,
                    },
                  ]}
                >
                  {#if typeof feature[UserTier.FREE] === 'boolean'}
                    {#if feature[UserTier.FREE]}
                      <CheckIcon class="text-success mx-auto h-4 w-4" />
                    {:else}
                      <MinusIcon class="text-secondary/30 mx-auto h-4 w-4" />
                    {/if}
                  {:else}
                    {feature[UserTier.FREE]}
                  {/if}
                </td>
                <td
                  class={[
                    'text-center',
                    {
                      'bg-primary/10 border-primary/60 border-r border-l': true,
                      'rounded-b-xl border-b': isLastSection && isLast,
                    },
                  ]}
                >
                  {#if typeof feature[UserTier.BUILDER] === 'boolean'}
                    {#if feature[UserTier.BUILDER]}
                      <CheckIcon class="text-success mx-auto h-4 w-4" />
                    {:else}
                      <MinusIcon class="text-secondary/30 mx-auto h-4 w-4" />
                    {/if}
                  {:else}
                    {feature[UserTier.BUILDER]}
                  {/if}
                </td>

                <td
                  class={[
                    'border-secondary/10 border-r text-center',
                    {
                      'rounded-b-xl border-b': isLastSection && isLast,
                    },
                  ]}
                >
                  {#if typeof feature[UserTier.PRO] === 'boolean'}
                    {#if feature[UserTier.PRO]}
                      <CheckIcon class="text-success mx-auto h-4 w-4" />
                    {:else}
                      <MinusIcon class="text-secondary/30 mx-auto h-4 w-4" />
                    {/if}
                  {:else}
                    {feature[UserTier.PRO]}
                  {/if}
                </td>
              </tr>
            {/each}
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
