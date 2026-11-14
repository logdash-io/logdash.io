<script lang="ts">
  import FunnelColumnsIcon from '$lib/domains/shared/icons/FunnelColumnsIcon.svelte';
  import FunnelRowsIcon from '$lib/domains/shared/icons/FunnelRowsIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import {
    Button,
    Input,
    Select,
    Tab,
    Tabs,
  } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';
  import { WebAnalyticsInsightState } from '../../application/web-analytics-dashboard.state.svelte';
  import type {
    WebAnalyticsBreakdownRow,
    WebAnalyticsChartType,
    WebAnalyticsFunnelLayout,
    WebAnalyticsFunnelMode,
    WebAnalyticsInsight,
    WebAnalyticsInsightBucket,
    WebAnalyticsInsightConfig,
    WebAnalyticsInsightMeasure,
    WebAnalyticsSchema,
    WebAnalyticsView,
  } from '../../domain/web-analytics';
  import {
    defaultBucket,
    FUNNEL_LAYOUTS,
    INSIGHT_DAYS,
    INSIGHT_EVENT_LIMITS,
    INSIGHT_TABS,
    INSIGHT_TYPES,
    insightConfig,
    insightDraft,
    insightProblem,
    stepKind,
    tabbedConfig,
    tabbedDraft,
    withEventCount,
  } from '../../domain/web-analytics-insight';
  import {
    dashboardViews,
    insightView,
  } from '../../domain/web-analytics-layout';
  import { WebAnalyticsService } from '../../infrastructure/web-analytics.service';
  import DetailsDialog from '../breakdown/DetailsDialog.svelte';
  import InsightFilters from './InsightFilters.svelte';

  type Props = {
    clusterId: string;
    isOpen: boolean;
    insight: WebAnalyticsInsight | null;
    views: WebAnalyticsView[];
    viewId: string;
    onclose: () => void;
    onsave: (
      config: WebAnalyticsInsightConfig,
      id: string | null,
    ) => Promise<void>;
  };

  const { clusterId, isOpen, insight, views, viewId, onclose, onsave }: Props =
    $props();

  const MAX_STEPS = 8;
  const SCHEMA_DAYS = 90;
  const MODES: { value: WebAnalyticsInsightMeasure; label: string }[] = [
    { value: 'events', label: 'Events' },
    { value: 'people', label: 'People' },
  ];
  const BUCKETS: { value: WebAnalyticsInsightBucket; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];
  const PICTURE_SHARES = [100, 74, 58, 46, 37, 31, 27, 24];
  const LAYOUT_ICONS = { columns: FunnelColumnsIcon, rows: FunnelRowsIcon };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const id = $props.id();

  let cardTitle = $state('');
  let drafts = $state([insightDraft()]);
  let active = $state(0);
  let viewChoice = $state('');
  let saving = $state(false);
  let error = $state<string | null>(null);

  const schema = new WebAnalyticsInsightState<WebAnalyticsSchema>(() =>
    WebAnalyticsService.readSchema(clusterId, SCHEMA_DAYS),
  );
  const pages = new WebAnalyticsInsightState<WebAnalyticsBreakdownRow[]>(() =>
    WebAnalyticsService.readBreakdown(
      clusterId,
      {
        from: new Date(Date.now() - SCHEMA_DAYS * 86_400_000),
        to: new Date(),
        granularity: 'day',
        tz,
        filters: [],
        compare: false,
      },
      'pages',
    ),
  );

  const draft = $derived(drafts[active]);
  const choices = $derived(dashboardViews(views));
  const config = $derived(
    tabbedConfig(cardTitle, drafts, {
      view: viewChoice || null,
      ...(insight &&
        viewChoice !== insightView(views, insight) && { grid: null }),
    }),
  );
  const problem = $derived(insightProblem(config));
  const tabbed = $derived(drafts.length > 1);
  const limits = $derived(INSIGHT_EVENT_LIMITS[draft.type]);
  const people = $derived(draft.type === 'funnel' && draft.mode === 'people');
  const eventNames = $derived(
    (schema.data?.events ?? []).map((event) => event.name),
  );
  const allKeys = $derived(
    keysOf(draft.events.map((event) => event.name.trim())),
  );
  const copy = $derived(texts(draft.type, draft.measure));
  const pictureShares = $derived(
    PICTURE_SHARES.slice(0, people ? draft.steps.length : draft.events.length),
  );

  $effect(() => {
    if (!isOpen) return;
    untrack(() => {
      const start = tabbedDraft(insight ?? undefined);
      cardTitle = start.title;
      drafts = start.drafts;
      active = 0;
      viewChoice = insight ? insightView(views, insight) : viewId;
      error = null;
      void schema.load();
    });
  });

  $effect(() => {
    if (people && !pages.data && !pages.loading && !pages.error)
      untrack(() => void pages.load());
  });

  function keysOf(names: string[]): string[] {
    const events = schema.data?.events ?? [];
    const picked = events.filter((event) => names.includes(event.name));
    return [
      ...new Set(
        (picked.length ? picked : events).flatMap((e) => e.properties),
      ),
    ].sort();
  }

  function texts(
    type: WebAnalyticsChartType,
    measure: WebAnalyticsInsightMeasure,
  ): {
    events: string;
    add: string;
    hint: string;
    name: string;
  } {
    if (type === 'trend')
      return {
        events: 'Lines',
        add: 'Add line',
        hint:
          measure === 'people'
            ? 'Each line counts the people who sent its event per day, week or month. An event counts a person only when the app sends a user ID.'
            : 'Each line counts its events per day, week or month, under its own label.',
        name: 'Active installs',
      };
    if (type === 'distribution')
      return {
        events: 'Event',
        add: '',
        hint:
          measure === 'people'
            ? 'Bars count the people by the number of days they sent the event in the period. An event counts a person only when the app sends a user ID.'
            : 'Bars count the events of each value of a numeric property.',
        name:
          measure === 'people'
            ? 'Active days, last 30 days'
            : 'Active days per month',
      };
    if (type === 'cohorts')
      return {
        events: 'Start event, then later events',
        add: 'Add later event',
        hint: 'Rows group events by a date property, such as the day of the first open.',
        name: 'Weekly install cohorts',
      };
    return {
      events: 'Steps',
      add: 'Add step',
      hint: 'Each step counts its events, so events sent once per person count people.',
      name: 'Install journey',
    };
  }

  function onType(type: WebAnalyticsChartType): void {
    draft.type = type;
    draft.events = withEventCount(draft.events, type);
    draft.bucket = null;
  }

  function onAddTab(): void {
    if (!tabbed) cardTitle = draft.title;
    drafts.push({ ...insightDraft(insightConfig(draft)), title: '' });
    active = drafts.length - 1;
  }

  function onRemoveTab(): void {
    drafts.splice(active, 1);
    active = Math.min(active, drafts.length - 1);
    if (!tabbed && !drafts[0].title.trim()) drafts[0].title = cardTitle;
  }

  function onMode(mode: WebAnalyticsFunnelMode): void {
    draft.mode = mode;
  }

  function onMeasure(measure: WebAnalyticsInsightMeasure): void {
    draft.measure = measure;
  }

  function onBucket(bucket: WebAnalyticsInsightBucket): void {
    draft.bucket = bucket;
  }

  function onLineBucket(index: number, bucket: string): void {
    draft.events[index].bucket = BUCKETS.find(
      (option) => option.value === bucket,
    )?.value;
  }

  function onAddEvent(): void {
    draft.events.push({ name: '', filters: [] });
  }

  function onRemoveEvent(index: number): void {
    draft.events.splice(index, 1);
  }

  function onAddStep(): void {
    draft.steps.push('goal:');
  }

  function onRemoveStep(index: number): void {
    draft.steps.splice(index, 1);
  }

  function onStepKind(index: number, kind: string): void {
    draft.steps[index] = `${kind}:${stepText(draft.steps[index])}`;
  }

  function onStepText(index: number, text: string): void {
    draft.steps[index] = `${stepKind(draft.steps[index])}:${text}`;
  }

  function stepText(step: string): string {
    return step.slice(step.indexOf(':') + 1);
  }

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (problem || saving) return;
    saving = true;
    error = null;
    try {
      await onsave(config, insight?.id ?? null);
      onclose();
    } catch (failure) {
      error = readHttpErrorMessage(failure) ?? 'Could not save the insight.';
    } finally {
      saving = false;
    }
  }
</script>

<DetailsDialog
  {isOpen}
  title={insight ? 'Edit insight' : 'Add insight'}
  class="h-[min(40rem,85dvh)] sm:max-w-2xl"
  {onclose}
>
  <form class="flex min-h-0 flex-1 flex-col" onsubmit={onSubmit}>
    <datalist id="{id}-events">
      {#each eventNames as name (name)}
        <option value={name}></option>
      {/each}
    </datalist>
    <datalist id="{id}-pages">
      {#each pages.data ?? [] as page (page.name)}
        <option value={page.name}></option>
      {/each}
    </datalist>
    <datalist id="{id}-keys">
      {#each allKeys as key (key)}
        <option value={key}></option>
      {/each}
    </datalist>

    <div
      class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-5"
    >
      {#if tabbed}
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium">Card name</span>
          <Input
            bind:value={cardTitle}
            class="w-full"
            maxlength={80}
            placeholder="Setup time"
          />
        </label>
      {/if}

      {#if tabbed}
        <div class="flex flex-wrap items-center gap-2">
          <Tabs size="sm" boxed aria-label="Charts in this card">
            {#each drafts as tab, index (index)}
              <Tab active={index === active} onclick={() => (active = index)}>
                {tab.title.trim() || `Tab ${index + 1}`}
              </Tab>
            {/each}
          </Tabs>
          {#if drafts.length < INSIGHT_TABS.max}
            <IconButton label="Add tab" onclick={onAddTab}>
              <PlusIcon class="size-3.5" />
            </IconButton>
          {/if}
          <IconButton
            label="Remove this tab"
            disabled={drafts.length <= 1}
            onclick={onRemoveTab}
          >
            <CloseIcon class="size-3.5" />
          </IconButton>
        </div>
      {/if}

      <div class="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          size="xs"
          label="Insight type"
          options={INSIGHT_TYPES}
          value={draft.type}
          onChange={onType}
        />
        {#if draft.type === 'funnel'}
          <SegmentedControl
            size="xs"
            label="Funnel counts"
            options={MODES}
            value={draft.mode}
            onChange={onMode}
          />
        {:else if draft.type === 'trend' || draft.type === 'distribution'}
          <SegmentedControl
            size="xs"
            label={draft.type === 'trend' ? 'Trend counts' : 'Histogram counts'}
            options={MODES}
            value={draft.measure}
            onChange={onMeasure}
          />
        {/if}
        {#if !tabbed}
          <button
            type="button"
            class="text-fg-tertiary hover:text-fg-default transition-ink focus-visible:outline-brand ml-auto flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm focus-visible:outline-2"
            onclick={onAddTab}
          >
            <PlusIcon class="size-3.5" />
            Add a tab
          </button>
        {/if}
      </div>

      <div class="flex gap-3">
        <label class="flex min-w-0 flex-1 flex-col gap-1.5">
          <span class="text-sm font-medium">
            {tabbed ? 'Tab name' : 'Name'}
          </span>
          <Input
            bind:value={draft.title}
            class="w-full"
            maxlength={80}
            placeholder={copy.name}
          />
        </label>
        <label class="flex w-36 shrink-0 flex-col gap-1.5">
          <span class="text-sm font-medium">Period</span>
          <Select bind:value={draft.days} class="w-full">
            {#each INSIGHT_DAYS as days (days)}
              <option value={days}>Last {days} days</option>
            {/each}
          </Select>
        </label>
      </div>

      {#if draft.type === 'funnel'}
        <fieldset class="flex flex-col gap-2">
          <legend class="pb-1.5 text-sm font-medium">Chart</legend>
          <div class="grid grid-cols-2 gap-2">
            {#each FUNNEL_LAYOUTS as layout (layout.value)}
              {@const Icon = LAYOUT_ICONS[layout.value]}
              <label
                class={[
                  'bg-surface-50-bg edge flex cursor-pointer flex-col gap-2.5 rounded-xl p-2.5 transition-shadow',
                  'hover:not-has-checked:inset-ring-surface-150-bg hover:inset-ring',
                  'has-checked:inset-ring-brand has-checked:inset-ring-[1.5px] has-focus-visible:shadow-(--focus-ring)',
                ]}
              >
                <input
                  type="radio"
                  name="{id}-layout"
                  value={layout.value}
                  bind:group={draft.layout}
                  class="sr-only"
                />
                {@render picture(layout.value)}
                <span class="flex flex-col gap-0.5">
                  <span class="flex items-center gap-1.5 text-sm font-medium">
                    <Icon class="size-4" />
                    {layout.label}
                  </span>
                  <span class="text-fg-muted text-xs">{layout.hint}</span>
                </span>
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}

      {#if people}
        <fieldset class="flex flex-col gap-2">
          <legend class="pb-1.5 text-sm font-medium">Steps</legend>
          <p class="text-fg-muted -mt-1 text-xs">
            Follows each visitor, or signed-in user, through pages and goals in
            order.
          </p>
          {#each draft.steps as step, index (index)}
            <div class="flex items-center gap-1.5">
              <span class="text-fg-muted w-4 shrink-0 text-xs tabular-nums">
                {index + 1}
              </span>
              <Select
                bind:value={
                  () => stepKind(step),
                  (kind: string) => onStepKind(index, kind)
                }
                size="sm"
                class="w-24 shrink-0"
                aria-label="Step {index + 1} kind"
              >
                <option value="page">Page</option>
                <option value="goal">Goal</option>
              </Select>
              <Input
                bind:value={
                  () => stepText(step),
                  (text: string) => onStepText(index, text)
                }
                size="sm"
                class="min-w-0 flex-1 font-mono"
                list={stepKind(step) === 'goal'
                  ? `${id}-events`
                  : `${id}-pages`}
                placeholder={stepKind(step) === 'goal' ? 'event name' : '/path'}
                aria-label="Step {index + 1}"
              />
              <IconButton
                label="Remove step {index + 1}"
                disabled={draft.steps.length <= 2}
                onclick={() => onRemoveStep(index)}
              >
                <CloseIcon class="size-3.5" />
              </IconButton>
            </div>
          {/each}
          {#if draft.steps.length < MAX_STEPS}
            {@render addButton('Add step', onAddStep)}
          {/if}
        </fieldset>
      {:else}
        <fieldset class="flex flex-col gap-2">
          <legend class="pb-1.5 text-sm font-medium">{copy.events}</legend>
          <p class="text-fg-muted -mt-1 text-xs">{copy.hint}</p>
          {#each draft.events as event, index (index)}
            <div
              class="bg-surface-50-bg edge flex flex-col gap-1.5 rounded-xl p-2"
            >
              <div class="flex items-center gap-1.5">
                <span
                  class="text-fg-muted w-4 shrink-0 pl-1 text-xs tabular-nums"
                >
                  {index + 1}
                </span>
                <Input
                  bind:value={event.name}
                  size="sm"
                  class="min-w-0 flex-1 font-mono"
                  list="{id}-events"
                  placeholder="event name"
                  aria-label="{copy.events} {index + 1} event"
                />
                {#if limits.max > limits.min}
                  <IconButton
                    label="Remove event {index + 1}"
                    disabled={draft.events.length <= limits.min}
                    onclick={() => onRemoveEvent(index)}
                  >
                    <CloseIcon class="size-3.5" />
                  </IconButton>
                {/if}
              </div>
              {#if draft.type === 'trend'}
                <div class="flex items-center gap-1.5 pl-5.5">
                  <Input
                    bind:value={event.label}
                    size="sm"
                    class="min-w-0 flex-1"
                    maxlength={40}
                    placeholder="Label, such as Weekly active"
                    aria-label="Line {index + 1} label"
                  />
                  <Select
                    bind:value={
                      () => event.bucket ?? '',
                      (bucket: string) => onLineBucket(index, bucket)
                    }
                    size="sm"
                    class="w-36 shrink-0"
                    aria-label="Line {index + 1} bucket"
                  >
                    <option value="">Same as chart</option>
                    {#each BUCKETS as bucket (bucket.value)}
                      <option value={bucket.value}>
                        Per {bucket.label.toLowerCase()}
                      </option>
                    {/each}
                  </Select>
                </div>
              {/if}
              <div class="flex flex-col gap-1.5 pl-5.5">
                <InsightFilters
                  bind:filters={event.filters}
                  keys={keysOf([event.name.trim()])}
                  label="Filter"
                  addLabel="Filter this event"
                />
              </div>
            </div>
          {/each}
          {#if draft.events.length < limits.max}
            {@render addButton(copy.add, onAddEvent)}
          {/if}
        </fieldset>

        <fieldset class="flex flex-col gap-2">
          <legend class="pb-1.5 text-sm font-medium">Every event</legend>
          <p class="text-fg-muted -mt-1 text-xs">
            Filters that each event above must match too, such as a cohort date
            range.
          </p>
          <InsightFilters
            bind:filters={draft.filters}
            keys={allKeys}
            label="Shared filter"
            addLabel="Add shared filter"
          />
        </fieldset>
      {/if}

      {#if draft.type === 'trend' || draft.type === 'cohorts'}
        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium">
            {draft.type === 'trend' ? 'Count per' : 'One row per'}
          </span>
          <SegmentedControl
            size="xs"
            label={draft.type === 'trend' ? 'Count per' : 'One row per'}
            options={BUCKETS}
            value={draft.bucket ?? defaultBucket(draft.type)}
            onChange={onBucket}
          />
          {#if draft.type === 'trend'}
            <p class="text-fg-muted text-xs">
              Lines without a bucket of their own count per this.
            </p>
          {/if}
        </div>
      {/if}

      {#if draft.type === 'distribution'}
        <div class="flex gap-3">
          {#if draft.measure !== 'people'}
            <label class="flex min-w-0 flex-1 flex-col gap-1.5">
              <span class="text-sm font-medium">Numeric property</span>
              <Input
                bind:value={draft.property}
                class="w-full font-mono"
                list="{id}-keys"
                placeholder="active_days"
              />
            </label>
          {/if}
          <label class="flex w-36 shrink-0 flex-col gap-1.5">
            <span class="text-sm font-medium">
              {draft.measure === 'people' ? 'Days per bar' : 'Bar width'}
            </span>
            <Input
              bind:value={draft.binSize}
              type="number"
              min={draft.measure === 'people' ? 1 : 0}
              step={draft.measure === 'people' ? 1 : 'any'}
              class="w-full"
            />
          </label>
        </div>
      {/if}

      {#if draft.type === 'cohorts'}
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium">Cohort date property</span>
          <Input
            bind:value={draft.property}
            class="w-full font-mono"
            list="{id}-keys"
            placeholder="cohort"
          />
        </label>
      {/if}

      {#if choices.length > 1}
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium">View</span>
          <Select bind:value={viewChoice} class="w-full">
            {#each choices as choice (choice.id)}
              <option value={choice.id}>{choice.name}</option>
            {/each}
          </Select>
        </label>
      {/if}
    </div>

    <footer class="edge-t flex items-center justify-end gap-3 px-5 py-4">
      {#if error}
        <p class="text-error mr-auto min-w-0 text-sm" role="alert">{error}</p>
      {:else if problem}
        <p class="text-fg-muted mr-auto min-w-0 text-sm">{problem}</p>
      {/if}
      <Button variant="ghost" onclick={onclose}>Cancel</Button>
      <Button
        variant="primary"
        type="submit"
        loading={saving}
        disabled={Boolean(problem)}
      >
        {insight ? 'Save' : 'Add insight'}
      </Button>
    </footer>
  </form>
</DetailsDialog>

{#snippet picture(layout: WebAnalyticsFunnelLayout)}
  {@const count = pictureShares.length}
  <svg
    class="h-16 w-full"
    viewBox="0 0 200 64"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    {#each pictureShares as share, index (index)}
      {#if layout === 'columns'}
        {@const width = (200 - 6 * (count - 1)) / count}
        {@const height = (share / 100) * 62}
        <rect
          class="picture-rest"
          x={index * (width + 6)}
          y="1"
          {width}
          height="62"
          rx="2"
        />
        <rect
          class="fill-chart-1"
          x={index * (width + 6)}
          y={63 - height}
          {width}
          {height}
          rx="2"
        />
      {:else}
        {@const height = (64 - 1.5 * (count - 1)) / count}
        {@const y = index * (height + 1.5)}
        <rect class="picture-row" x="0" {y} width={share * 2} {height} rx="2" />
        <rect
          class="fill-fg-muted"
          x="6"
          y={y + height / 2 - 1}
          width={40 + ((index * 37) % 5) * 9}
          height="2"
          rx="1"
        />
        <rect
          class="fill-fg-tertiary"
          x="176"
          y={y + height / 2 - 1}
          width="18"
          height="2"
          rx="1"
        />
      {/if}
    {/each}
  </svg>
{/snippet}

{#snippet addButton(label: string, onclick: () => void)}
  <button
    type="button"
    class="text-fg-tertiary hover:text-fg-default transition-ink focus-visible:outline-brand flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm focus-visible:outline-2"
    {onclick}
  >
    <PlusIcon class="size-3.5" />
    {label}
  </button>
{/snippet}

<style>
  .picture-rest {
    fill: color-mix(in oklch, var(--chart-1) 14%, var(--surface-50-bg));
  }

  .picture-row {
    fill: var(--surface-150-bg);
  }
</style>
