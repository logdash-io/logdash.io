<script lang="ts">
  import MinusIcon from '$lib/domains/shared/icons/MinusIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import {
    datadogComparisonData,
    datadogFeatureComparisonData,
  } from './compare.data';
  import { ArrowRightIcon } from 'lucide-svelte';
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-24 px-4 py-16 sm:px-8">
  <header class="flex flex-col gap-6 text-center">
    <h1 class="text-4xl font-extrabold leading-tight md:text-6xl">
      Logdash vs Datadog
    </h1>
    <p class="text-base-content/70 mx-auto max-w-2xl text-xl leading-relaxed">
      Datadog is the gold standard for enterprise observability. But if you're a
      SaaS founder, you don't need a $10,000/month tool. Logdash gives you
      everything you need at a fraction of the cost and complexity.
    </p>

    <div
      class="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row"
    >
      <a href="/app/auth" class="btn btn-primary w-full sm:w-auto">
        Start free
        <ArrowRightIcon class="size-4" />
      </a>
    </div>
  </header>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h3 class="text-3xl font-bold">Who is who and what is what?</h3>
    </div>

    <div class="overflow-hidden rounded-xl border border-base-content/10">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              class="border-b border-r border-base-content/10 bg-base-200/30 px-6 py-5 text-left text-base font-medium"
            >
              Feature
            </th>
            <th
              class="border-b border-r border-base-content/10 bg-base-200/30 px-6 py-5 text-left text-base font-medium"
            >
              Datadog
            </th>
            <th
              class="border-b border-base-content/10 bg-base-200/30 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each datadogComparisonData as point, i}
            <tr>
              <td
                class={[
                  'border-r border-base-content/10 px-6 py-5 font-medium',
                  { 'border-b': i < datadogComparisonData.length - 1 },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-base-content/10 px-6 py-5',
                  { 'border-b': i < datadogComparisonData.length - 1 },
                ]}
              >
                <div class="flex items-center gap-2">
                  {#if point.logdashWin === 'both'}
                    <PlusIcon class="text-success h-5 w-5 shrink-0" />
                  {:else if point.logdashWin === true}
                    <MinusIcon class="text-error h-5 w-5 shrink-0" />
                  {:else if point.logdashWin === false}
                    <PlusIcon class="text-success h-5 w-5 shrink-0" />
                  {/if}
                  {point.competitor}
                </div>
              </td>
              <td
                class={[
                  'px-6 py-5',
                  {
                    'border-b border-base-content/10':
                      i < datadogComparisonData.length - 1,
                  },
                ]}
              >
                <div class="flex items-center gap-2">
                  {#if point.logdashWin === 'both'}
                    <PlusIcon class="text-success h-5 w-5 shrink-0" />
                  {:else if point.logdashWin === false}
                    <MinusIcon class="text-error h-5 w-5 shrink-0" />
                  {:else if point.logdashWin === true}
                    <PlusIcon class="text-success h-5 w-5 shrink-0" />
                  {/if}
                  {point.logdash}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h2
        class="text-base-content/40 mb-2 text-sm font-bold uppercase tracking-widest"
      ></h2>
      <h3 class="text-3xl font-bold">The "No-Nonsense" Comparison</h3>
      <p class="text-base-content/70 mx-auto mt-4 max-w-2xl text-lg">
        Datadog is built for Fortune 500 companies with dedicated DevOps teams.
        Logdash is built for founders who need answers fast without breaking the
        bank.
      </p>
    </div>

    <div class="ld-card-base ld-card-rounding overflow-hidden p-2 sm:p-4">
      <div class="grid md:grid-cols-2">
        <div class="bg-base-200/30 p-6 sm:p-8">
          <div class="mb-2 font-bold uppercase tracking-wide">
            The "Datadog" Path
            <br />
            (Enterprise Scale)
          </div>
          <ol class="text-base-content/80 mt-4 list-decimal space-y-2 pl-5">
            <li>You install multiple agents.</li>
            <li>Then you configure log pipelines.</li>
            <li>Then you build custom dashboards.</li>
            <li>Then you optimize for cost.</li>
            <li>Then you get your first bill shock.</li>
          </ol>
          <div class="mt-6 border-l-2 border-dashed pl-4">
            <div class="text-sm font-bold">Result:</div>
            <div class="text-lg">Powerful insights, enterprise costs.</div>
          </div>
        </div>

        <div
          class="bg-primary/5 p-6 sm:p-8 flex flex-col justify-between rounded-2xl"
        >
          <div class="flex flex-col">
            <div class="text-primary mb-2 font-bold uppercase tracking-wide">
              The "Logdash" Path
              <br />
              (Founder Focus)
            </div>
            <ol
              class="text-base-content/80 mt-4 list-decimal space-y-2 pl-5 font-medium"
            >
              <li>You add the SDK.</li>
              <li>Everything works immediately.</li>
            </ol>
          </div>
          <div class="border-primary/40 mt-6 border-l-2 pl-4">
            <div class="text-sm font-bold">Result:</div>
            <div class="text-lg font-bold">
              Full monitoring at startup-friendly pricing.
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-base-content/80 italic text-center px-3 pb-2 sm:pb-0">
      Logdash removes the enterprise tax from your observability.
    </p>
  </section>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h3 class="text-3xl font-bold">Feature Comparison Table</h3>
    </div>

    <div class="overflow-hidden rounded-xl border border-base-content/10">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              class="border-b border-r border-base-content/10 bg-base-200/30 px-6 py-5 text-left text-base font-medium"
            >
              Feature
            </th>
            <th
              class="border-b border-r border-base-content/10 bg-base-200/30 px-6 py-5 text-left text-base font-medium"
            >
              Datadog
            </th>
            <th
              class="border-b border-base-content/10 bg-base-200/30 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each datadogFeatureComparisonData as point, i}
            <tr>
              <td
                class={[
                  'border-r border-base-content/10 px-6 py-5 font-medium',
                  { 'border-b': i < datadogFeatureComparisonData.length - 1 },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-base-content/10 px-6 py-5',
                  { 'border-b': i < datadogFeatureComparisonData.length - 1 },
                ]}
              >
                <div class="flex items-center gap-2">
                  {#if point.logdashWin === 'both'}
                    <PlusIcon class="text-success h-5 w-5 shrink-0" />
                  {:else if point.logdashWin === true}
                    <MinusIcon class="text-error h-5 w-5 shrink-0" />
                  {:else if point.logdashWin === false}
                    <PlusIcon class="text-success h-5 w-5 shrink-0" />
                  {/if}
                  {point.competitor}
                </div>
              </td>
              <td
                class={[
                  'px-6 py-5',
                  {
                    'border-b border-base-content/10':
                      i < datadogFeatureComparisonData.length - 1,
                  },
                ]}
              >
                <div class="flex items-center gap-2">
                  {#if point.logdashWin === 'both'}
                    <PlusIcon class="text-success h-5 w-5 shrink-0" />
                  {:else if point.logdashWin === false}
                    <MinusIcon class="text-error h-5 w-5 shrink-0" />
                  {:else if point.logdashWin === true}
                    <PlusIcon class="text-success h-5 w-5 shrink-0" />
                  {/if}
                  {point.logdash}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h2
        class="text-base-content/40 mb-2 text-sm font-bold uppercase tracking-widest"
      ></h2>
      <h3 class="text-3xl font-bold">The Trade-off: Power vs. Simplicity.</h3>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="ld-card bg-base-200/50 p-8">
        <h4 class="mb-4 text-xl font-bold">
          Datadog is like a commercial airliner.
        </h4>
        <p class="text-base-content/80 text-lg leading-relaxed">
          It can monitor hundreds of microservices across multiple clouds. But
          you need a full crew to operate it and deep pockets to fuel it.
        </p>
      </div>

      <div class="ld-card border-primary/20 bg-primary/5 p-8 border">
        <h4 class="mb-4 text-xl font-bold">
          <span class="bg-primary/10 text-primary rounded-lg px-2 py-1">
            Logdash
          </span>
          is like a private jet.
        </h4>
        <p class="text-base-content/80 text-lg leading-relaxed">
          It gets you where you need to go quickly, without the overhead,
          complexity, or cost of enterprise tooling.
        </p>
      </div>
    </div>

    <p class="text-center text-base-content/80 text-lg">
      Do you need enterprise scale, or do you need founder speed?
    </p>
  </section>

  <section class="mb-12 text-center">
    <h2 class="mb-4 text-3xl font-bold leading-normal">
      Save Datadog for when you're a unicorn.
      <br />
      Use Logdash while you're building one.
    </h2>
    <p class="text-base-content/70 mx-auto mb-8 max-w-2xl text-xl">
      Datadog is brilliant for enterprises. But if you're pre-Series B, you need
      monitoring that respects your budget and your time.
      <br />
      <span class="text-base-content font-medium">
        See how affordable observability can be.
      </span>
    </p>
    <a href="/demo-dashboard" class="btn btn-primary gap-2">
      Start free
      <ArrowRightIcon class="size-4" />
    </a>
  </section>
</div>
