<script lang="ts">
  import { resolve } from '$app/paths';
  import MinusIcon from '$lib/domains/shared/icons/MinusIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import {
    grafanaComparisonData,
    grafanaFeatureComparisonData,
  } from './compare.data';
  import { ArrowRightIcon } from 'lucide-svelte';
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-24 px-4 py-16 sm:px-8">
  <header class="flex flex-col gap-6 text-center">
    <h1
      class="text-4xl font-medium tracking-[-0.03em] leading-tight md:text-6xl"
    >
      Logdash vs Grafana
    </h1>
    <p class="text-neutral-400 mx-auto max-w-2xl text-xl leading-relaxed">
      Grafana is the Swiss Army knife of observability. But if you're a founder,
      you don't need to configure Prometheus, Loki, and custom dashboards.
      Logdash gives you monitoring that works out of the box.
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
              Grafana
            </th>
            <th
              class="border-b border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each grafanaComparisonData as point, i (point.feature)}
            <tr>
              <td
                class={[
                  'border-r border-hairline px-6 py-5 font-medium',
                  { 'border-b': i < grafanaComparisonData.length - 1 },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-hairline px-6 py-5',
                  { 'border-b': i < grafanaComparisonData.length - 1 },
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
                      i < grafanaComparisonData.length - 1,
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
        Grafana gives you infinite flexibility. Logdash gives you instant
        clarity. Choose based on what matters more: customization or speed.
      </p>
    </div>

    <div class="ld-card-base ld-card-rounding overflow-hidden p-2 sm:p-4">
      <div class="grid md:grid-cols-2">
        <div class="bg-neutral-900 p-6 sm:p-8">
          <div class="mb-2 font-semibold uppercase tracking-wide">
            The "Grafana" Path
            <br />
            (DIY Everything)
          </div>
          <ol class="text-neutral-300 mt-4 list-decimal space-y-2 pl-5">
            <li>You set up Prometheus for metrics.</li>
            <li>Then you configure Loki for logs.</li>
            <li>Then you build custom dashboards.</li>
            <li>Then you write PromQL queries.</li>
            <li>Then you configure alerts.</li>
          </ol>
          <div class="mt-6 border-l-2 border-dashed pl-4">
            <div class="text-sm font-semibold">Result:</div>
            <div class="text-lg">Total control, weeks of configuration.</div>
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
              (Zero Config)
            </div>
            <ol
              class="text-neutral-300 mt-4 list-decimal space-y-2 pl-5 font-medium"
            >
              <li>You add the SDK.</li>
              <li>Dashboards appear automatically.</li>
            </ol>
          </div>
          <div class="border-primary/40 mt-6 border-l-2 pl-4">
            <div class="text-sm font-semibold">Result:</div>
            <div class="text-lg font-semibold">
              Monitoring, logs, and metrics work instantly.
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-neutral-300 italic text-center px-3 pb-2 sm:pb-0">
      Logdash removes the configuration tax from your observability.
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
              Grafana
            </th>
            <th
              class="border-b border-hairline bg-neutral-900 px-6 py-5 text-left text-base font-medium"
            >
              Logdash
            </th>
          </tr>
        </thead>
        <tbody>
          {#each grafanaFeatureComparisonData as point, i (point.feature)}
            <tr>
              <td
                class={[
                  'border-r border-hairline px-6 py-5 font-medium',
                  { 'border-b': i < grafanaFeatureComparisonData.length - 1 },
                ]}
              >
                {point.feature}
              </td>
              <td
                class={[
                  'border-r border-hairline px-6 py-5',
                  { 'border-b': i < grafanaFeatureComparisonData.length - 1 },
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
                      i < grafanaFeatureComparisonData.length - 1,
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
        The Trade-off: Flexibility vs. Simplicity.
      </h3>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="ld-card bg-neutral-900 p-8">
        <h4 class="mb-4 text-xl font-semibold">Grafana is like LEGO.</h4>
        <p class="text-neutral-300 text-lg leading-relaxed">
          You can build anything you want, but you need to source the bricks,
          read the instructions, and spend hours assembling the pieces.
        </p>
      </div>

      <div class="ld-card border-primary/20 bg-primary/5 p-8 border">
        <h4 class="mb-4 text-xl font-semibold">
          <span class="bg-primary/10 text-primary rounded-lg px-2 py-1">
            Logdash
          </span>
          is like a pre-built model.
        </h4>
        <p class="text-neutral-300 text-lg leading-relaxed">
          It comes ready to use. No assembly required. Just open the box and
          start monitoring.
        </p>
      </div>
    </div>

    <p class="text-center text-neutral-300 text-lg">
      Do you want to build dashboards, or do you want to use them?
    </p>
  </section>

  <section class="mb-12 text-center">
    <h2 class="mb-4 text-3xl font-medium tracking-[-0.03em] leading-normal">
      Keep Grafana for your inner engineer.
      <br />
      Use Logdash for your inner founder.
    </h2>
    <p class="text-neutral-400 mx-auto mb-8 max-w-2xl text-xl">
      Grafana is amazing if you love tinkering with configurations. But if you'd
      rather ship product than tune dashboards, Logdash is built for you.
      <br />
      <span class="text-base-content font-medium">
        See how simple monitoring can be.
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
