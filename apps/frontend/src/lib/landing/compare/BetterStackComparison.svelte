<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button } from '@logdash/hyper-ui/presentational';
  import ComparisonMark from './ComparisonMark.svelte';
  import {
    betterStackComparisonData,
    betterStackFeatureComparisonData,
  } from './compare.data';
  import { ArrowRightIcon } from 'lucide-svelte';
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-24 px-4 py-16 sm:px-8">
  <header class="flex flex-col gap-6 text-center">
    <h1
      class="text-4xl font-medium tracking-[-0.03em] leading-tight md:text-6xl"
    >
      Logdash vs Better Stack
    </h1>
    <p class="text-neutral-400 mx-auto max-w-2xl text-xl leading-relaxed">
      Better Stack is a solid monitoring platform. Both tools target startups
      and founders. The difference? Logdash unifies everything into one simple
      product, while Better Stack spreads features across multiple tools.
    </p>

    <div
      class="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row"
    >
      <Button
        href={resolve('/app/quick-setup')}
        rel="nofollow"
        variant="primary"
        class="w-full sm:w-auto"
      >
        Start free
        <ArrowRightIcon class="size-4" />
      </Button>
    </div>
  </header>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h2 class="text-3xl font-semibold">Who is who and what is what?</h2>
    </div>

    <div class="overflow-hidden rounded-xl border border-hairline">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              class="border-b border-r border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Feature
            </th>
            <th
              class="border-b border-r border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Better Stack
            </th>
            <th
              class="border-b border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each betterStackComparisonData as point, i (point.feature)}
            <tr>
              <td
                class={[
                  'border-r border-hairline px-6 py-5 font-medium',
                  { 'border-b': i < betterStackComparisonData.length - 1 },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-hairline px-6 py-5',
                  { 'border-b': i < betterStackComparisonData.length - 1 },
                ]}
              >
                <ComparisonMark
                  good={point.logdashWin !== true}
                  text={point.competitor}
                />
              </td>
              <td
                class={[
                  'px-6 py-5',
                  {
                    'border-b border-hairline':
                      i < betterStackComparisonData.length - 1,
                  },
                ]}
              >
                <ComparisonMark
                  good={point.logdashWin !== false}
                  text={point.logdash}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h2 class="text-3xl font-medium tracking-[-0.03em]">
        The "No-Nonsense" Comparison
      </h2>
      <p class="text-neutral-400 mx-auto mt-4 max-w-2xl text-lg">
        Both tools serve founders. Better Stack has more products. Logdash has
        more integration. Choose based on your preference: suite of tools or
        unified platform.
      </p>
    </div>

    <div class="ld-card-base ld-card-rounding overflow-hidden p-2 sm:p-4">
      <div class="grid md:grid-cols-2">
        <div class="bg-neutral-900 p-6 sm:p-8">
          <div class="mb-2 font-semibold uppercase tracking-wide">
            The "Better Stack" Path
            <br />
            (Multiple Products)
          </div>
          <ol class="text-neutral-300 mt-4 list-decimal space-y-2 pl-5">
            <li>You sign up for Better Uptime.</li>
            <li>Then you add Logtail for logs.</li>
            <li>Then you purchase status pages separately.</li>
            <li>Then you manage multiple billing.</li>
          </ol>
          <div class="mt-6 border-l-2 border-dashed pl-4">
            <div class="text-sm font-semibold">Result:</div>
            <div class="text-lg">Good features, fragmented experience.</div>
          </div>
        </div>

        <div
          class="bg-neutral-800 p-6 sm:p-8 flex flex-col justify-between rounded-2xl"
        >
          <div class="flex flex-col">
            <div class="text-brand mb-2 font-semibold uppercase tracking-wide">
              The "Logdash" Path
              <br />
              (Unified Platform)
            </div>
            <ol
              class="text-neutral-300 mt-4 list-decimal space-y-2 pl-5 font-medium"
            >
              <li>You add the SDK.</li>
              <li>
                Monitoring, logs, metrics, and status pages work together.
              </li>
            </ol>
          </div>
          <div class="border-neutral-500 mt-6 border-l-2 pl-4">
            <div class="text-sm font-semibold">Result:</div>
            <div class="text-lg font-semibold">
              Everything in one place, one price, one login.
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-neutral-300 italic text-center px-3 pb-2 sm:pb-0">
      Logdash removes the fragmentation from your monitoring stack.
    </p>
  </section>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h2 class="text-3xl font-semibold">Feature Comparison Table</h2>
    </div>

    <div class="overflow-hidden rounded-xl border border-hairline">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              class="border-b border-r border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Feature
            </th>
            <th
              class="border-b border-r border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Better Stack
            </th>
            <th
              class="border-b border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each betterStackFeatureComparisonData as point, i (point.feature)}
            <tr>
              <td
                class={[
                  'border-r border-hairline px-6 py-5 font-medium',
                  {
                    'border-b': i < betterStackFeatureComparisonData.length - 1,
                  },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-hairline px-6 py-5',
                  {
                    'border-b': i < betterStackFeatureComparisonData.length - 1,
                  },
                ]}
              >
                <ComparisonMark
                  good={point.logdashWin !== true}
                  text={point.competitor}
                />
              </td>
              <td
                class={[
                  'px-6 py-5',
                  {
                    'border-b border-hairline':
                      i < betterStackFeatureComparisonData.length - 1,
                  },
                ]}
              >
                <ComparisonMark
                  good={point.logdashWin !== false}
                  text={point.logdash}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h2 class="text-3xl font-medium tracking-[-0.03em]">
        The Trade-off: Suite vs. Platform.
      </h2>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="ld-card bg-neutral-900 p-8">
        <h3 class="mb-4 text-xl font-semibold">
          Better Stack is like separate apps.
        </h3>
        <p class="text-neutral-300 text-lg leading-relaxed">
          You get dedicated tools for uptime, logs, and incidents. Each is good,
          but they don't talk to each other seamlessly.
        </p>
      </div>

      <div class="ld-card border-neutral-700 p-8 border">
        <h3 class="mb-4 text-xl font-semibold">
          <span class="bg-neutral-800 text-brand rounded-lg px-2 py-1">
            Logdash
          </span>
          is like a unified workspace.
        </h3>
        <p class="text-neutral-300 text-lg leading-relaxed">
          Everything is designed to work together from day one. One dashboard,
          one mental model, one experience.
        </p>
      </div>
    </div>

    <p class="text-center text-neutral-300 text-lg">
      Do you want separate products, or do you want one cohesive platform?
    </p>
  </section>

  <section class="mb-12 text-center">
    <h2 class="mb-4 text-3xl font-medium tracking-[-0.03em] leading-normal">
      Both are great choices.
      <br />
      We just think differently about integration.
    </h2>
    <p class="text-neutral-400 mx-auto mb-8 max-w-2xl text-xl">
      Better Stack offers you best-of-breed products. Logdash offers you a
      unified experience. Try both and see which philosophy fits your workflow.
      <br />
      <span class="text-fg-default font-medium">
        See how unified monitoring feels.
      </span>
    </p>
    <Button
      href={resolve('/app/quick-setup')}
      rel="nofollow"
      variant="primary"
      class="gap-2"
    >
      Start free
      <ArrowRightIcon class="size-4" />
    </Button>
  </section>
</div>
