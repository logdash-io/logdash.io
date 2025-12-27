<script lang="ts">
  import MinusIcon from '$lib/domains/shared/icons/MinusIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import {
    betterStackComparisonData,
    betterStackFeatureComparisonData,
  } from './compare.data';
  import { ArrowRightIcon } from 'lucide-svelte';
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-24 px-4 py-16 sm:px-8">
  <header class="flex flex-col gap-6 text-center">
    <h1 class="text-4xl font-extrabold leading-tight md:text-6xl">
      Logdash vs Better Stack
    </h1>
    <p class="text-base-content/70 mx-auto max-w-2xl text-xl leading-relaxed">
      Better Stack is a solid monitoring platform. Both tools target startups
      and founders. The difference? Logdash unifies everything into one simple
      product, while Better Stack spreads features across multiple tools.
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
              Better Stack
            </th>
            <th
              class="border-b border-base-content/10 bg-base-200/30 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each betterStackComparisonData as point, i}
            <tr>
              <td
                class={[
                  'border-r border-base-content/10 px-6 py-5 font-medium',
                  { 'border-b': i < betterStackComparisonData.length - 1 },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-base-content/10 px-6 py-5',
                  { 'border-b': i < betterStackComparisonData.length - 1 },
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
                      i < betterStackComparisonData.length - 1,
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
        Both tools serve founders. Better Stack has more products. Logdash has
        more integration. Choose based on your preference: suite of tools or
        unified platform.
      </p>
    </div>

    <div class="ld-card-base ld-card-rounding overflow-hidden p-2 sm:p-4">
      <div class="grid md:grid-cols-2">
        <div class="bg-base-200/30 p-6 sm:p-8">
          <div class="mb-2 font-bold uppercase tracking-wide">
            The "Better Stack" Path
            <br />
            (Multiple Products)
          </div>
          <ol class="text-base-content/80 mt-4 list-decimal space-y-2 pl-5">
            <li>You sign up for Better Uptime.</li>
            <li>Then you add Logtail for logs.</li>
            <li>Then you purchase status pages separately.</li>
            <li>Then you manage multiple billing.</li>
          </ol>
          <div class="mt-6 border-l-2 border-dashed pl-4">
            <div class="text-sm font-bold">Result:</div>
            <div class="text-lg">Good features, fragmented experience.</div>
          </div>
        </div>

        <div
          class="bg-primary/5 p-6 sm:p-8 flex flex-col justify-between rounded-2xl"
        >
          <div class="flex flex-col">
            <div class="text-primary mb-2 font-bold uppercase tracking-wide">
              The "Logdash" Path
              <br />
              (Unified Platform)
            </div>
            <ol
              class="text-base-content/80 mt-4 list-decimal space-y-2 pl-5 font-medium"
            >
              <li>You add the SDK.</li>
              <li>
                Monitoring, logs, metrics, and status pages work together.
              </li>
            </ol>
          </div>
          <div class="border-primary/40 mt-6 border-l-2 pl-4">
            <div class="text-sm font-bold">Result:</div>
            <div class="text-lg font-bold">
              Everything in one place, one price, one login.
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-base-content/80 italic text-center px-3 pb-2 sm:pb-0">
      Logdash removes the fragmentation from your monitoring stack.
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
              Better Stack
            </th>
            <th
              class="border-b border-base-content/10 bg-base-200/30 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each betterStackFeatureComparisonData as point, i}
            <tr>
              <td
                class={[
                  'border-r border-base-content/10 px-6 py-5 font-medium',
                  {
                    'border-b': i < betterStackFeatureComparisonData.length - 1,
                  },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-base-content/10 px-6 py-5',
                  {
                    'border-b': i < betterStackFeatureComparisonData.length - 1,
                  },
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
                      i < betterStackFeatureComparisonData.length - 1,
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
      <h3 class="text-3xl font-bold">The Trade-off: Suite vs. Platform.</h3>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="ld-card bg-base-200/50 p-8">
        <h4 class="mb-4 text-xl font-bold">
          Better Stack is like separate apps.
        </h4>
        <p class="text-base-content/80 text-lg leading-relaxed">
          You get dedicated tools for uptime, logs, and incidents. Each is good,
          but they don't talk to each other seamlessly.
        </p>
      </div>

      <div class="ld-card border-primary/20 bg-primary/5 p-8 border">
        <h4 class="mb-4 text-xl font-bold">
          <span class="bg-primary/10 text-primary rounded-lg px-2 py-1">
            Logdash
          </span>
          is like a unified workspace.
        </h4>
        <p class="text-base-content/80 text-lg leading-relaxed">
          Everything is designed to work together from day one. One dashboard,
          one mental model, one experience.
        </p>
      </div>
    </div>

    <p class="text-center text-base-content/80 text-lg">
      Do you want separate products, or do you want one cohesive platform?
    </p>
  </section>

  <section class="mb-12 text-center">
    <h2 class="mb-4 text-3xl font-bold leading-normal">
      Both are great choices.
      <br />
      We just think differently about integration.
    </h2>
    <p class="text-base-content/70 mx-auto mb-8 max-w-2xl text-xl">
      Better Stack offers you best-of-breed products. Logdash offers you a
      unified experience. Try both and see which philosophy fits your workflow.
      <br />
      <span class="text-base-content font-medium">
        See how unified monitoring feels.
      </span>
    </p>
    <a href="/demo-dashboard" class="btn btn-primary gap-2">
      Start free
      <ArrowRightIcon class="size-4" />
    </a>
  </section>
</div>
