<script lang="ts">
  import { ArrowDownIcon } from 'lucide-svelte';
  import PricingComparisonTable from './PricingComparisonTable.svelte';
  import PricingGrid from './PricingGrid.svelte';
  import PricingTrustProof from './PricingTrustProof.svelte';
  import FoundersCard from '$lib/landing/FoundersCard.svelte';
</script>

<section class="my-16 px-4">
  <PricingTrustProof />
</section>

<section class="px-4">
  <PricingGrid />

  <a
    href="#detailed-plans-comparison"
    class="btn btn-primary text-base-content btn-outline mx-auto my-12 flex w-fit items-center gap-2 rounded-full font-normal"
  >
    Compare plans
    <ArrowDownIcon class="size-4" />
  </a>

  <FoundersCard>
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
  </FoundersCard>

  <div class="distance h-8 md:h-16"></div>

  <PricingComparisonTable />
</section>
