<script lang="ts">
  import MinusIcon from '$lib/domains/shared/icons/MinusIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { posthogComparisonData, featureComparisonData } from './compare.data';
  import { CheckIcon, ArrowRightIcon } from 'lucide-svelte';
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-24 px-4 py-16 sm:px-8">
  <!-- Headline & Sub-headline -->
  <header class="flex flex-col gap-6 text-center">
    <h1 class="text-4xl font-extrabold leading-tight md:text-6xl">
      PostHog vs Logdash
    </h1>
    <p class="text-base-content/70 mx-auto max-w-2xl text-xl leading-relaxed">
      PostHog is great, we use it at Logdash too. It’s the most powerful
      analytics tool on the market. But despite some features overlap, it's a
      fundamentally different tool. Let's break it down.
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

  <!-- THE COMPARISON -->
  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h3 class="text-3xl font-bold">Who is who and what is what?</h3>
    </div>

    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr class="border-base-content/10 border-b-2">
            <th
              class="text-base-content/40 w-1/4 py-4 text-left text-sm font-bold uppercase tracking-wider"
            ></th>
            <th
              class="text-base-content/60 w-1/3 py-4 text-left text-sm font-bold uppercase tracking-wider"
            >
              PostHog
            </th>
            <th
              class="text-base-content/60 w-1/3 py-4 text-left text-sm font-bold uppercase tracking-wider"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each posthogComparisonData as point}
            <tr
              class="border-base-content/5 hover:bg-base-200/20 border-b transition-colors"
            >
              <td class="py-6 font-medium">{point.feature}</td>
              <td class="py-6 text-base">
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
              <td class="py-6 text-base">
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
      >
        <!-- The "No-Nonsense" Comparison -->
      </h2>
      <h3 class="text-3xl font-bold">The "No-Nonsense" Comparison</h3>
      <p class="text-base-content/70 mx-auto mt-4 max-w-2xl text-lg">
        Same Engine, Different Philosophy. Both tools are built on ClickHouse,
        giving you the same enterprise-grade reliability and speed. We don’t
        optimize for feature count - they have more. We optimize for clarity.
      </p>
    </div>

    <div class="ld-card-base ld-card-rounding overflow-hidden p-2 sm:p-4">
      <div class="grid md:grid-cols-2">
        <div class="bg-base-200/30 p-6 sm:p-8">
          <div class="mb-2 font-bold uppercase tracking-wide">
            The "PostHog" Path
            <br />
            (Maximum Control)
          </div>
          <ol class="text-base-content/80 mt-4 list-decimal space-y-2 pl-5">
            <li>You install the SDK.</li>
            <li>Then you define events.</li>
            <li>Then you manually build funnels.</li>
            <li>Then you configure ingestion pipelines.</li>
            <li>Then you debug your configuration.</li>
          </ol>
          <div class="mt-6 border-l-2 border-dashed pl-4">
            <div class="text-sm font-bold">Result:</div>
            <div class="text-lg">Powerful data, eventually.</div>
          </div>
        </div>

        <div
          class="bg-primary/5 p-6 sm:p-8 flex flex-col justify-between rounded-2xl"
        >
          <div class="flex flex-col">
            <div class="text-primary mb-2 font-bold uppercase tracking-wide">
              The "Logdash" Path
              <br />
              (Maximum Speed)
            </div>
            <ol
              class="text-base-content/80 mt-4 list-decimal space-y-2 pl-5 font-medium"
            >
              <li>Your LLM integrates the SDK.</li>
            </ol>
          </div>
          <div class="border-primary/40 mt-6 border-l-2 pl-4">
            <div class="text-sm font-bold">Result:</div>
            <div class="text-lg font-bold">
              You see your logs, errors, and KPIs instantly.
            </div>
          </div>
        </div>
      </div>

      <p
        class="text-base-content/80 mt-4 text-sm italic text-center px-3 pb-2 sm:pb-0"
      >
        Logdash removes the "Tax of Complexity" from your observability.
      </p>
    </div>
  </section>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h3 class="text-3xl font-bold">Feature Comparison Table</h3>
    </div>

    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr class="border-base-content/10 border-b-2">
            <th
              class="text-base-content/40 w-1/4 py-4 text-left text-sm font-bold uppercase tracking-wider"
            ></th>
            <th
              class="text-base-content/60 w-1/3 py-4 text-left text-sm font-bold uppercase tracking-wider"
            >
              PostHog
            </th>
            <th
              class="text-base-content/60 w-1/3 py-4 text-left text-sm font-bold uppercase tracking-wider"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each featureComparisonData as point}
            <tr
              class="border-base-content/5 hover:bg-base-200/20 border-b transition-colors"
            >
              <td class="py-6 font-medium">{point.feature}</td>
              <td class="py-6 text-base">
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
              <td class="py-6 text-base">
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
      >
        <!-- Wise old man said -->
      </h2>
      <h3 class="text-3xl font-bold">The Trade-off: Control vs. Speed.</h3>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="ld-card bg-base-200/50 p-8">
        <h4 class="mb-4 text-xl font-bold">PostHog is like Photoshop.</h4>
        <p class="text-base-content/80 text-lg leading-relaxed">
          You can do almost anything with it, but you need to learn layers,
          masks, and filters. It’s designed for experts who need total control.
        </p>
      </div>

      <div class="ld-card border-primary/20 bg-primary/5 p-8 border">
        <h4 class="mb-4 text-xl font-bold">
          <span class="bg-primary/10 text-primary rounded-lg px-2 py-1">
            Logdash
          </span>
          is like Instagram Filters.
        </h4>
        <p class="text-base-content/80 text-lg leading-relaxed">
          You press a button, and it looks perfect immediately. It’s designed
          for founders who need to move fast.
        </p>
      </div>
    </div>

    <p class="text-center text-base-content/80 text-lg">
      Do you want to configure the tool, or do you want to get the juice (fast)?
    </p>
  </section>

  <!-- FINAL CTA -->
  <section class="mb-12 text-center">
    <h2 class="mb-4 text-3xl font-bold leading-normal">
      Keep PostHog for the deep dives.
      <br />
      Use Logdash for the daily drive.
    </h2>
    <p class="text-base-content/70 mx-auto mb-8 max-w-2xl text-xl">
      You don't have to replace PostHog to enjoy Logdash.
      <br />
      Just don't use a quantum computer to check your pulse.
      <br />
      <span class="text-base-content font-medium">
        See how simple "simple" can be.
      </span>
    </p>
    <a href="/demo-dashboard" class="btn btn-primary gap-2">
      Start free
      <ArrowRightIcon class="size-4" />
    </a>
  </section>
</div>
