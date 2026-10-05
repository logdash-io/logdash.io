<script lang="ts">
  import { Dropdown, Spinner } from '@logdash/hyper-ui/presentational';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import { formatCount, formatPercent } from '../../domain/analytics-format';
  import type {
    WebAnalyticsFunnelStep,
    WebAnalyticsRange,
    WebAnalyticsReport,
  } from '../../domain/web-analytics';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';

  type Props = {
    clusterId: string;
    report: WebAnalyticsReport | null;
    range: WebAnalyticsRange;
  };

  const { clusterId, report, range }: Props = $props();

  const MAX_STEPS = 5;
  const storageKey = `ld-funnel-${untrack(() => clusterId)}`;

  let steps = $state<string[]>(readSteps());
  const funnel = new WebAnalyticsInsightState<WebAnalyticsFunnelStep[]>(() =>
    WebAnalyticsService.readFunnel(clusterId, range, steps),
  );

  const options = $derived([
    ...(report?.breakdowns.pages ?? []).map((row) => `page:${row.name}`),
    ...(report?.breakdowns.goals ?? []).map((row) => `goal:${row.name}`),
  ]);
  const suggested = $derived(
    options.filter((option) => !steps.includes(option)),
  );
  const peak = $derived(Math.max(1, funnel.data?.[0]?.visitors ?? 0));

  $effect(() => {
    void range;
    const current = steps;
    untrack(() => {
      localStorage.setItem(storageKey, JSON.stringify(current));
      if (current.length >= 2) void funnel.load();
    });
  });

  function readSteps(): string[] {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem(storageKey) ?? '[]',
      );
      return Array.isArray(saved)
        ? saved.filter((step): step is string => typeof step === 'string')
        : [];
    } catch {
      return [];
    }
  }

  function stepLabel(step: string): string {
    return step.slice(step.indexOf(':') + 1);
  }

  function stepKind(step: string): string {
    return step.startsWith('goal:') ? 'Goal' : 'Page';
  }

  function onAdd(step: string): void {
    steps = [...steps, step];
  }

  function onRemove(index: number): void {
    steps = steps.filter((_, position) => position !== index);
  }
</script>

<div class="flex flex-wrap items-center gap-2 pb-2">
  {#each steps as step, index (step)}
    <span
      class="border-surface-100-border bg-surface-100-bg flex h-8 max-w-64 items-center gap-1.5 rounded-lg border pr-1 pl-2.5 text-sm"
    >
      <span class="text-fg-muted text-xs tabular-nums">{index + 1}</span>
      <span class="text-fg-muted text-xs">{stepKind(step)}</span>
      <span class="truncate font-medium">{stepLabel(step)}</span>
      <button
        type="button"
        class="hover:bg-surface-100-hover-bg hover:text-fg-default transition-ink flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-muted"
        aria-label="Remove step {index + 1}"
        onclick={() => onRemove(index)}
      >
        <CloseIcon class="size-3.5" />
      </button>
    </span>
  {/each}
  {#if steps.length < MAX_STEPS}
    <Dropdown>
      {#snippet trigger(attrs)}
        <button
          {...attrs}
          type="button"
          class="border-surface-100-border text-fg-tertiary hover:text-fg-default hover:bg-surface-25-hover-bg flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed px-2.5 text-sm"
          disabled={!suggested.length}
        >
          <PlusIcon class="size-3.5" />
          Add step
        </button>
      {/snippet}
      <ul
        class="bg-surface-elevated-bg border-surface-elevated-border mt-2 flex border max-h-72 w-64 flex-col overflow-y-auto rounded-xl p-1.5 shadow-lg"
      >
        {#each suggested as option (option)}
          <li>
            <button
              type="button"
              class="hover:bg-surface-elevated-hover-bg flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-sm"
              onclick={() => onAdd(option)}
            >
              <span class="text-fg-muted w-9 shrink-0 text-xs">
                {stepKind(option)}
              </span>
              <span class="truncate">{stepLabel(option)}</span>
            </button>
          </li>
        {/each}
      </ul>
    </Dropdown>
  {/if}
</div>

{#if steps.length < 2}
  <div
    class="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center"
  >
    <p class="font-medium">Build a funnel</p>
    <p class="text-fg-tertiary max-w-sm text-sm">
      Add at least two pages or goals to see how many visitors move from one
      step to the next, in order, within this period.
    </p>
  </div>
{:else if funnel.loading && !funnel.data}
  <div class="flex flex-1 items-center justify-center py-16"><Spinner /></div>
{:else if funnel.error}
  <p class="text-error py-10 text-center text-sm" role="alert">
    {funnel.error}
  </p>
{:else if funnel.data}
  <ol
    class="grid flex-1 gap-2"
    style:grid-template-columns="repeat({funnel.data.length}, minmax(0, 1fr))"
  >
    {#each funnel.data as step, index (step.step)}
      {@const previous = funnel.data[index - 1]?.visitors}
      <li class="flex min-w-0 flex-col gap-2">
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-lg font-semibold tabular-nums">
            {formatCount(step.visitors)}
          </span>
          {#if previous !== undefined}
            <span class="text-fg-muted text-xs tabular-nums">
              {formatPercent(previous ? (step.visitors / previous) * 100 : 0)}
            </span>
          {/if}
        </div>
        <div
          class="bg-surface-50-bg relative h-44 overflow-hidden rounded-lg edge"
        >
          <div
            class="bg-surface-200-bg absolute inset-x-0 bottom-0 rounded-lg"
            style:height="{Math.max(2, (step.visitors / peak) * 100)}%"
          ></div>
        </div>
        <p class="truncate text-sm" title={stepLabel(step.step)}>
          <span class="text-fg-muted text-xs">{index + 1}.</span>
          {stepLabel(step.step)}
        </p>
      </li>
    {/each}
  </ol>
{/if}
