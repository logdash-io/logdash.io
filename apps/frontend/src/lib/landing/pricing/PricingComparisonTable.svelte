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

<div id="detailed-plans-comparison" class="mx-auto max-w-7xl pt-24 md:pt-56">
  <div class="-my-24 pb-24 md:-my-56 md:pb-56">
    <h2 class="mb-8 text-center text-3xl md:mb-16 md:text-5xl">
      {FEATURES_COMPARISON.title}
    </h2>

    <div class="overflow-x-auto px-4 md:px-0">
      <div class="min-w-[1000px]">
        <table
          class="table w-full table-fixed"
          style="border-collapse: separate; border-spacing: 0;"
        >
          <thead>
            <tr class="border-none">
              <th
                class="w-1/6 min-w-[140px] text-left font-bold md:w-1/4 md:min-w-[200px]"
              ></th>
              {#each FEATURES_COMPARISON.plans as plan (plan.tier)}
                {@const fullPlanConfig = PAYMENT_PLANS.find(
                  (p) => p.tier === plan.tier,
                )}
                <th
                  style="border-spacing: 0;"
                  class={[
                    'relative h-24 w-1/4 min-w-[170px] p-0 text-center font-bold md:min-w-[180px]',
                  ]}
                >
                  {#if plan.tier === UserTier.BUILDER}
                    <div
                      class="bg-primary text-secondary top-0 left-0 z-0 -mb-6 flex h-12 w-full items-center justify-center rounded-xl pb-6 text-xs font-semibold md:-mb-8 md:h-16 md:pb-8"
                    >
                      Most Popular
                    </div>
                  {:else}
                    <div class="h-6 md:h-8"></div>
                  {/if}

                  <div
                    class={[
                      'relative z-10 h-64 p-3 pt-6 text-left md:h-80 md:p-4 md:pt-9',
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
                        'badge badge-soft mb-3 ml-1 text-xs md:mb-4 md:ml-2',
                        fullPlanConfig.badge.class,
                      ]}
                    >
                      {fullPlanConfig.badge.text}
                    </div>

                    <div class="card-body p-0 px-2 md:px-4">
                      <h2 class="card-title text-lg font-normal md:text-2xl">
                        {fullPlanConfig.name}
                      </h2>
                      <div class="mt-2">
                        <span class="text-2xl font-semibold md:text-4xl">
                          {fullPlanConfig.price}
                        </span>

                        <p
                          class="mt-2 text-xs whitespace-pre-wrap opacity-75 md:mt-4 md:text-sm"
                        >
                          {fullPlanConfig.description.split('.')[0]}
                        </p>
                      </div>

                      <div class="card-actions my-3 justify-center md:my-4">
                        <button
                          onclick={() => handleGithubLogin(fullPlanConfig.tier)}
                          disabled={loggingIn || fullPlanConfig['disabled']}
                          class={`btn btn-sm md:btn-md w-full rounded-full text-xs font-medium md:text-sm ${fullPlanConfig.popular ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          {#if loggingIn}
                            <div
                              in:fade={{ duration: 150 }}
                              class="flex h-4 w-4 items-center justify-center md:h-6 md:w-6"
                            >
                              <span
                                class="loading loading-spinner h-3 w-3 md:h-4 md:w-4"
                              ></span>
                            </div>
                          {/if}

                          {fullPlanConfig.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                </th>
              {/each}
            </tr>
          </thead>

          <tbody>
            <tr>
              <td class="py-3 md:py-4">
                <div class="flex items-center gap-2">
                  <ShieldCheckIcon
                    class="text-success h-4 w-4 shrink-0 md:h-6 md:w-6"
                  />
                  <span class="text-sm md:text-base">
                    30-Day Money Back Guarantee
                  </span>
                </div>
              </td>
              {#each FEATURES_COMPARISON.plans as plan (plan.tier)}
                <td
                  class={[
                    'py-3 text-center md:py-4',
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
                  <td class="py-3 text-sm font-medium md:py-4 md:text-base">
                    {feature.name}
                  </td>
                  <td
                    class={[
                      'border-secondary/10 border-l py-3 text-center md:py-4',
                      {
                        'rounded-b-xl border-b': isLastSection && isLast,
                      },
                    ]}
                  >
                    {#if typeof feature[UserTier.FREE] === 'boolean'}
                      {#if feature[UserTier.FREE]}
                        <CheckIcon
                          class="text-success mx-auto h-3 w-3 md:h-4 md:w-4"
                        />
                      {:else}
                        <MinusIcon
                          class="text-secondary/30 mx-auto h-3 w-3 md:h-4 md:w-4"
                        />
                      {/if}
                    {:else}
                      <span class="text-xs md:text-sm">
                        {feature[UserTier.FREE]}
                      </span>
                    {/if}
                  </td>
                  <td
                    class={[
                      'py-3 text-center md:py-4',
                      {
                        'bg-primary/10 border-primary/60 border-r border-l': true,
                        'rounded-b-xl border-b': isLastSection && isLast,
                      },
                    ]}
                  >
                    {#if typeof feature[UserTier.BUILDER] === 'boolean'}
                      {#if feature[UserTier.BUILDER]}
                        <CheckIcon
                          class="text-success mx-auto h-3 w-3 md:h-4 md:w-4"
                        />
                      {:else}
                        <MinusIcon
                          class="text-secondary/30 mx-auto h-3 w-3 md:h-4 md:w-4"
                        />
                      {/if}
                    {:else}
                      <span class="text-xs md:text-sm">
                        {feature[UserTier.BUILDER]}
                      </span>
                    {/if}
                  </td>

                  <td
                    class={[
                      'border-secondary/10 border-r py-3 text-center md:py-4',
                      {
                        'rounded-b-xl border-b': isLastSection && isLast,
                      },
                    ]}
                  >
                    {#if typeof feature[UserTier.PRO] === 'boolean'}
                      {#if feature[UserTier.PRO]}
                        <CheckIcon
                          class="text-success mx-auto h-3 w-3 md:h-4 md:w-4"
                        />
                      {:else}
                        <MinusIcon
                          class="text-secondary/30 mx-auto h-3 w-3 md:h-4 md:w-4"
                        />
                      {/if}
                    {:else}
                      <span class="text-xs md:text-sm">
                        {feature[UserTier.PRO]}
                      </span>
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
</div>
