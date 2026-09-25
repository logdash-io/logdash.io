<script lang="ts">
  import { resolve } from '$app/paths';
  import CheckIcon from '$lib/domains/shared/icons/CheckIcon.svelte';
  import MinusIcon from '$lib/domains/shared/icons/MinusIcon.svelte';
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';
  import { FEATURES_COMPARISON } from './feature-comparison.config.js';

  const LABEL_CELL =
    'bg-base-300 px-4 text-left max-md:sticky max-md:left-0 max-md:z-10 max-md:shadow-[inset_-1px_0_0_var(--color-hairline)] sm:px-6 lg:px-10';
</script>

<div class="relative overflow-x-auto">
  <table class="w-full min-w-[48rem] table-fixed border-collapse text-sm">
    <colgroup>
      <col class="w-36 md:w-[34%]" />
      {#each PAYMENT_PLANS as plan (plan.tier)}
        <col />
      {/each}
    </colgroup>

    <thead>
      <tr>
        <th scope="col" class={LABEL_CELL}>
          <span class="sr-only">Feature</span>
        </th>
        {#each PAYMENT_PLANS as plan (plan.tier)}
          <th
            scope="col"
            class="border-hairline border-l px-4 py-8 text-left align-top font-normal lg:px-6"
          >
            <span class="block text-base font-medium">{plan.name}</span>
            <span class="text-neutral-400 mt-1 block tabular-nums">
              {plan.price}
            </span>
            <!-- eslint-disable svelte/no-navigation-without-resolve -- resolve() plus the tier query -->
            <a
              href={`${resolve('/app/auth')}?tier=${plan.tier}`}
              class={[
                'btn btn-sm mt-5 w-full rounded-full font-medium',
                plan.popular ? 'btn-primary' : 'btn-subtle',
              ]}
            >
              {plan.buttonText}
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          </th>
        {/each}
      </tr>
    </thead>

    {#each FEATURES_COMPARISON.sections as section (section.name)}
      <tbody>
        <tr class="border-hairline border-t">
          <th
            scope="colgroup"
            class={[LABEL_CELL, 'text-neutral-500 pt-8 pb-3 font-medium']}
          >
            {section.name}
          </th>
          {#each PAYMENT_PLANS as plan (plan.tier)}
            <td class="border-hairline border-l"></td>
          {/each}
        </tr>

        {#each section.features as feature (feature.name)}
          <tr class="border-hairline border-t">
            <th
              scope="row"
              class={[LABEL_CELL, 'text-neutral-300 py-3 font-normal']}
            >
              {feature.name}
            </th>
            {#each PAYMENT_PLANS as plan (plan.tier)}
              {@const value = feature[plan.tier]}
              <td class="border-hairline border-l px-4 py-3 lg:px-6">
                {#if value === true}
                  <CheckIcon class="text-base-content size-4" />
                  <span class="sr-only">Included</span>
                {:else if value === false}
                  <MinusIcon class="text-neutral-700 size-4" />
                  <span class="sr-only">Not included</span>
                {:else}
                  <span class="text-neutral-300">{value}</span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    {/each}
  </table>
</div>
