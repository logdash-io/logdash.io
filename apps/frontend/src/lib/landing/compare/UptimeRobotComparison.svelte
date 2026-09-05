<script lang="ts">
  import { resolve } from '$app/paths';
  import MinusIcon from '$lib/domains/shared/icons/MinusIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import {
    uptimeRobotComparisonData,
    uptimeRobotFeatureComparisonData,
  } from './compare.data';
  import { ArrowRightIcon } from 'lucide-svelte';
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-24 px-4 py-16 sm:px-8">
  <header class="flex flex-col gap-6 text-center">
    <h1
      class="text-4xl font-medium tracking-[-0.03em] leading-tight md:text-6xl"
    >
      Logdash vs Uptime Robot
    </h1>
    <p class="text-neutral-400 mx-auto max-w-2xl text-xl leading-relaxed">
      Uptime Robot pioneered uptime monitoring. But it stops there. Logdash
      gives you uptime monitoring plus logs, metrics, and modern tooling in one
      cohesive experience.
    </p>

    <div
      class="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row"
    >
      <a
        href={resolve('/app/quick-setup')}
        rel="nofollow"
        class="btn btn-primary w-full sm:w-auto"
      >
        Start free
        <ArrowRightIcon class="size-4" />
      </a>
    </div>
  </header>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h3 class="text-3xl font-semibold">Who is who and what is what?</h3>
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
              Uptime Robot
            </th>
            <th
              class="border-b border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each uptimeRobotComparisonData as point, i (point.feature)}
            <tr>
              <td
                class={[
                  'border-r border-hairline px-6 py-5 font-medium',
                  { 'border-b': i < uptimeRobotComparisonData.length - 1 },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-hairline px-6 py-5',
                  { 'border-b': i < uptimeRobotComparisonData.length - 1 },
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
                    'border-b border-hairline':
                      i < uptimeRobotComparisonData.length - 1,
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
        class="text-neutral-600 mb-2 text-sm font-semibold uppercase tracking-widest"
      ></h2>
      <h3 class="text-3xl font-medium tracking-[-0.03em]">
        The "No-Nonsense" Comparison
      </h3>
      <p class="text-neutral-400 mx-auto mt-4 max-w-2xl text-lg">
        Uptime Robot checks if your site is up. Logdash shows you why it went
        down, what happened, and what your users experienced.
      </p>
    </div>

    <div class="ld-card-base ld-card-rounding overflow-hidden p-2 sm:p-4">
      <div class="grid md:grid-cols-2">
        <div class="bg-neutral-900 p-6 sm:p-8">
          <div class="mb-2 font-semibold uppercase tracking-wide">
            The "Uptime Robot" Path
            <br />
            (Basic Monitoring)
          </div>
          <ol class="text-neutral-300 mt-4 list-decimal space-y-2 pl-5">
            <li>You add monitors for your endpoints.</li>
            <li>Then you wait for alerts.</li>
            <li>When something breaks, you get a notification.</li>
            <li>Then you go hunting for logs elsewhere.</li>
          </ol>
          <div class="mt-6 border-l-2 border-dashed pl-4">
            <div class="text-sm font-semibold">Result:</div>
            <div class="text-lg">You know when things break, not why.</div>
          </div>
        </div>

        <div
          class="bg-primary/5 p-6 sm:p-8 flex flex-col justify-between rounded-2xl"
        >
          <div class="flex flex-col">
            <div
              class="text-primary mb-2 font-semibold uppercase tracking-wide"
            >
              The "Logdash" Path
              <br />
              (Full Context)
            </div>
            <ol
              class="text-neutral-300 mt-4 list-decimal space-y-2 pl-5 font-medium"
            >
              <li>You add the SDK.</li>
              <li>Uptime monitoring works automatically.</li>
              <li>When something breaks, you get the full story.</li>
            </ol>
          </div>
          <div class="border-primary/40 mt-6 border-l-2 pl-4">
            <div class="text-sm font-semibold">Result:</div>
            <div class="text-lg font-semibold">
              You see the alert, logs, and metrics in one place.
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-neutral-300 italic text-center px-3 pb-2 sm:pb-0">
      Logdash provides context, not just pings.
    </p>
  </section>

  <section class="flex flex-col gap-8">
    <div class="text-center">
      <h3 class="text-3xl font-semibold">Feature Comparison Table</h3>
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
              Uptime Robot
            </th>
            <th
              class="border-b border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each uptimeRobotFeatureComparisonData as point, i (point.feature)}
            <tr>
              <td
                class={[
                  'border-r border-hairline px-6 py-5 font-medium',
                  {
                    'border-b': i < uptimeRobotFeatureComparisonData.length - 1,
                  },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-hairline px-6 py-5',
                  {
                    'border-b': i < uptimeRobotFeatureComparisonData.length - 1,
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
                    'border-b border-hairline':
                      i < uptimeRobotFeatureComparisonData.length - 1,
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
        class="text-neutral-600 mb-2 text-sm font-semibold uppercase tracking-widest"
      ></h2>
      <h3 class="text-3xl font-medium tracking-[-0.03em]">
        The Trade-off: Alerts vs. Insights.
      </h3>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="ld-card bg-neutral-900 p-8">
        <h4 class="mb-4 text-xl font-semibold">
          Uptime Robot is like a smoke alarm.
        </h4>
        <p class="text-neutral-300 text-lg leading-relaxed">
          It tells you when something is wrong, but you still need to figure out
          where the fire is and how to put it out.
        </p>
      </div>

      <div class="ld-card border-primary/20 bg-primary/5 p-8 border">
        <h4 class="mb-4 text-xl font-semibold">
          <span class="bg-primary/10 text-primary rounded-lg px-2 py-1">
            Logdash
          </span>
          is like a fire department.
        </h4>
        <p class="text-neutral-300 text-lg leading-relaxed">
          It shows you the fire, what started it, and gives you the tools to fix
          it immediately.
        </p>
      </div>
    </div>

    <p class="text-center text-neutral-300 text-lg">
      Do you want to know when things break, or do you want to understand why?
    </p>
  </section>

  <section class="mb-12 text-center">
    <h2 class="mb-4 text-3xl font-medium tracking-[-0.03em] leading-normal">
      Uptime Robot checks the pulse.
      <br />
      Logdash gives you the full diagnosis.
    </h2>
    <p class="text-neutral-400 mx-auto mb-8 max-w-2xl text-xl">
      Keep Uptime Robot if you only need basic checks. Choose Logdash if you
      want monitoring with context and insights.
      <br />
      <span class="text-base-content font-medium">
        See how simple "complete" can be.
      </span>
    </p>
    <a
      href={resolve('/app/quick-setup')}
      rel="nofollow"
      class="btn btn-primary gap-2"
    >
      Start free
      <ArrowRightIcon class="size-4" />
    </a>
  </section>
</div>
