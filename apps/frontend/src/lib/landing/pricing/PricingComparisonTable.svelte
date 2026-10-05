<script lang="ts">
  import Price from '$lib/domains/shared/ui/components/Price.svelte';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import MinusIcon from '$lib/domains/shared/icons/MinusIcon.svelte';
  import { PAYMENT_PLANS } from '$lib/domains/shared/payment-plans.const.js';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { FEATURES_COMPARISON } from './feature-comparison.config.js';
  import { planHref } from './plan-href';

  const LABEL_CELL =
    'bg-surface-root-bg px-4 text-left max-md:sticky max-md:left-0 max-md:z-10 max-md:shadow-[inset_-1px_0_0_var(--surface-root-border)] sm:px-6 lg:px-10';
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
            class="border-surface-root-border border-l px-4 py-8 text-left align-top font-normal lg:px-6"
          >
            <span class="block text-base font-medium">{plan.name}</span>
            <span class="text-fg-tertiary mt-1 block">
              <Price price={plan.price} />
            </span>
            <Button
              href={planHref(plan.tier)}
              variant={plan.popular ? 'primary' : 'secondary'}
              size="sm"
              block
              class="mt-5"
            >
              {plan.buttonText}
            </Button>
          </th>
        {/each}
      </tr>
    </thead>

    {#each FEATURES_COMPARISON.sections as section (section.name)}
      <tbody>
        <tr class="border-surface-root-border border-t">
          <th
            scope="colgroup"
            class={[LABEL_CELL, 'text-fg-muted pt-8 pb-3 font-medium']}
          >
            {section.name}
          </th>
          {#each PAYMENT_PLANS as plan (plan.tier)}
            <td class="border-surface-root-border border-l"></td>
          {/each}
        </tr>

        {#each section.features as feature (feature.name)}
          <tr class="border-surface-root-border border-t">
            <th
              scope="row"
              class={[LABEL_CELL, 'text-fg-secondary py-3 font-normal']}
            >
              {feature.name}
            </th>
            {#each PAYMENT_PLANS as plan (plan.tier)}
              {@const value = feature[plan.tier]}
              <td class="border-surface-root-border border-l px-4 py-3 lg:px-6">
                {#if value === true}
                  <CheckIcon class="text-fg-default size-4" />
                  <span class="sr-only">Included</span>
                {:else if value === false}
                  <MinusIcon class="text-fg-disabled size-4" />
                  <span class="sr-only">Not included</span>
                {:else}
                  <span class="text-fg-secondary">{value}</span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    {/each}
  </table>
</div>
