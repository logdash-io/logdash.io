<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import ServiceHealthStrip from '$lib/domains/app/clusters/ui/ServiceHealthStrip.svelte';
  import { SettingsCardHeader } from '$lib/domains/shared/ui/components/settings-card';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { DateTime } from 'luxon';
  import { onMount, untrack, type Snippet } from 'svelte';
  import {
    WebAnalyticsCachedState,
    WebAnalyticsDayVisitsState,
    WebAnalyticsGoalsState,
  } from '../application/day-analytics.state.svelte';
  import {
    WebAnalyticsDashboardState,
    WebAnalyticsInsightsState,
  } from '../application/web-analytics-dashboard.state.svelte';
  import {
    analyticsSearch,
    dayRange,
    parseAnalyticsQuery,
    withFilter,
    type AnalyticsQuery,
  } from '../domain/analytics-query';
  import {
    addDays,
    dayHeadline,
    daysBetween,
    groupRows,
    isRecord,
    stripDays,
    stripSummary,
    typicalHours,
  } from '../domain/day-analytics';
  import type {
    WebAnalyticsDay,
    WebAnalyticsDayParams,
    WebAnalyticsDays,
    WebAnalyticsDayVisit,
    WebAnalyticsFilter,
    WebAnalyticsInsight,
    WebAnalyticsInsightConfig,
    WebAnalyticsTrafficCard,
    WebAnalyticsViewInput,
    WebAnalyticsVisitor,
    WebAnalyticsVisitShow,
  } from '../domain/web-analytics';
  import {
    activeView,
    dashboardViews,
    viewLayout,
  } from '../domain/web-analytics-layout';
  import { WebAnalyticsService } from '../infrastructure/web-analytics.service';
  import ActiveFilters from './ActiveFilters.svelte';
  import BreakdownCard from './breakdown/BreakdownCard.svelte';
  import DayCard from './day/DayCard.svelte';
  import DaysCard from './day/DaysCard.svelte';
  import DayToolbar from './day/DayToolbar.svelte';
  import DayVisitsCard from './day/DayVisitsCard.svelte';
  import VisitGroupsCard from './day/VisitGroupsCard.svelte';
  import EventPanel from './event/EventPanel.svelte';
  import GoalsCard from './insights/GoalsCard.svelte';
  import InsightEditor from './insights/InsightEditor.svelte';
  import InsightsBar from './insights/InsightsBar.svelte';
  import InsightsCard from './insights/InsightsCard.svelte';
  import InsightsSection from './insights/InsightsSection.svelte';
  import LayoutDialog from './insights/LayoutDialog.svelte';
  import VisitorDialog from './insights/VisitorDialog.svelte';
  import WebAnalyticsSetup from './WebAnalyticsSetup.svelte';

  type Props = { clusterId: string; goals: string[] | null };
  const { clusterId, goals: savedGoals }: Props = $props();

  const STRIP_DAYS = 28;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const goalTitleId = $props.id();

  const analytics = new WebAnalyticsDashboardState(untrack(() => clusterId));
  const goals = new WebAnalyticsGoalsState(
    untrack(() => clusterId),
    untrack(() => savedGoals),
  );
  const days = new WebAnalyticsCachedState<WebAnalyticsDays>(
    untrack(() => `${clusterId}:days`),
  );
  const day = new WebAnalyticsCachedState<WebAnalyticsDay>(
    untrack(() => `${clusterId}:day`),
  );
  const visits = new WebAnalyticsDayVisitsState(untrack(() => clusterId));
  const insights = new WebAnalyticsInsightsState(untrack(() => clusterId));

  let clock = $state(DateTime.local());
  let show = $state<WebAnalyticsVisitShow>('all');
  let pinned = $state<string | null>(null);
  let preview = $state<string | null>(null);
  let goal = $state<string | null>(null);
  let opened = $state<WebAnalyticsVisitor | null>(null);
  let revision = $state(0);
  let editing = $state<WebAnalyticsInsight | null>(null);
  let editorOpen = $state(false);
  let layoutOpen = $state(false);
  let reportKey = '';

  const query = $derived(parseAnalyticsQuery(page.url.searchParams));
  const ready = $derived(insights.insights !== null);
  const view = $derived(activeView(insights.views, query.view));
  const layout = $derived(
    viewLayout(insights.views, view, insights.insights ?? []),
  );
  const traffic = $derived((ready || insights.error !== null) && view.traffic);
  const today = $derived(days.data?.today ?? clock.toISODate() ?? '');
  const since = $derived(days.data?.since ?? null);
  const date = $derived(
    !query.day || query.day >= today
      ? today
      : since && query.day < since
        ? since
        : query.day,
  );
  const live = $derived(date === today);
  const shown = $derived(preview ?? date);
  const shownLive = $derived(shown === today);
  const now = $derived(clock.toFormat('HH:mm'));
  const stripEnd = $derived(
    addDays(
      today,
      -Math.floor(daysBetween(date, today) / STRIP_DAYS) * STRIP_DAYS,
    ),
  );
  const filterKey = $derived(
    analyticsSearch({
      day: null,
      filters: query.filters,
      event: null,
      view: null,
    }),
  );
  const params = $derived.by((): WebAnalyticsDayParams | null => {
    if (!goals.picked) return null;
    const filters = parseAnalyticsQuery(new URLSearchParams(filterKey)).filters;
    return { tz, goals: goals.picked, filters };
  });
  const picked = $derived(params?.goals ?? []);
  const strip = $derived(
    days.data && params ? stripDays(days.data, picked.length) : [],
  );
  const summary = $derived(stripSummary(strip));
  const focused = $derived(strip.find((entry) => entry.date === shown) ?? null);
  const sources = $derived(
    day.data ? groupRows(day.data.sources, day.data.dates, since) : [],
  );
  const pages = $derived(
    day.data ? groupRows(day.data.pages, day.data.dates, since) : [],
  );
  const headline = $derived(
    focused
      ? dayHeadline({
          date: shown,
          inProgress: shownLive,
          time: now,
          verdict: focused.verdict,
          goals: picked,
          sources: day.data?.date === shown ? sources : [],
          record: isRecord(strip, shown),
        })
      : null,
  );
  const by = $derived(shownLive ? ` by ${now}` : '');
  const weekdays = $derived(`${DateTime.fromISO(shown).toFormat('cccc')}s`);
  const range = $derived(dayRange(date, tz, query.filters));
  const error = $derived(
    days.error ?? day.error ?? goals.error ?? analytics.error,
  );

  $effect(() => topBarState.show(toolbar));

  onMount(() => {
    void analytics.loadSite();
    void insights.load();
    void goals.load(tz);
    const timer = setInterval(onTick, 60_000);
    return () => clearInterval(timer);
  });

  $effect(() => {
    if (!params || !traffic) return;
    const end = stripEnd;
    const current = params;
    untrack(() => loadDays(end, current, end === today));
  });

  $effect(() => {
    if (!params || !traffic || (query.day && !days.data)) return;
    const at = shown;
    const current = params;
    untrack(() => {
      void loadDay(at, current, at === today);
      void prefetch(addDays(at, -1));
    });
  });

  $effect(() => {
    if (!params || !traffic || (query.day && !days.data)) return;
    const at = date;
    const current = params;
    const shown = show;
    untrack(() => void visits.load(at, current, shown));
  });

  $effect(() => {
    if (query.event) goal = query.event;
  });

  $effect(() => {
    if (!traffic || !params) return;
    void range;
    void picked;
    untrack(loadReport);
  });

  function loadDays(
    end: string,
    current: WebAnalyticsDayParams,
    revalidate: boolean,
  ): void {
    void days.load(
      JSON.stringify([end, current]),
      () => WebAnalyticsService.readDays(clusterId, end, current),
      revalidate,
    );
  }

  async function loadDay(
    at: string,
    current: WebAnalyticsDayParams,
    revalidate: boolean,
  ): Promise<void> {
    await day.load(
      dayKey(at, current),
      () => WebAnalyticsService.readDay(clusterId, at, current),
      revalidate,
    );
  }

  async function prefetch(at: string): Promise<void> {
    if (!params || !since || at < since || at > today) return;
    const current = params;
    await day.prefetch(dayKey(at, current), () =>
      WebAnalyticsService.readDay(clusterId, at, current),
    );
  }

  function dayKey(at: string, current: WebAnalyticsDayParams): string {
    return JSON.stringify([at, current, at === today]);
  }

  function loadReport(): void {
    if (!params) return;
    const key = JSON.stringify([range, picked]);
    if (key === reportKey) return;
    reportKey = key;
    void analytics.load(range, picked);
  }

  function refresh(force = false): void {
    void analytics.loadSite();
    if (force) {
      revision += 1;
      void insights.load();
    }
    if (goals.error) void goals.load(tz);
    if (!params || !traffic) return;
    loadDays(stripEnd, params, true);
    if (shownLive || force) void loadDay(shown, params, true);
    if (!live && !force) return;
    void visits.refresh(date, params, show);
    reportKey = '';
    loadReport();
  }

  function onTick(): void {
    clock = DateTime.local();
    if (!document.hidden) refresh();
  }

  function onVisibilityChange(): void {
    if (!document.hidden) onTick();
  }

  async function onQueryChange(next: AnalyticsQuery): Promise<void> {
    await goto(resolve(`/app/domains/${clusterId}${analyticsSearch(next)}`), {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }

  async function onDay(next: string): Promise<void> {
    if (next > today || !since || next < since) return;
    await onQueryChange({ ...query, day: next === today ? null : next });
  }

  async function onSelect(next: string): Promise<void> {
    if (next === date) {
      preview = null;
      return;
    }
    preview = next;
    await onDay(next);
    if (preview === next) preview = null;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (
      !traffic ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
      (event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, dialog, [contenteditable], [role="radiogroup"], [popover]',
        ))
    )
      return;
    event.preventDefault();
    void onDay(addDays(date, event.key === 'ArrowLeft' ? -1 : 1));
  }

  function onFilter(filter: WebAnalyticsFilter): void {
    void onQueryChange(withFilter(query, filter));
  }

  function onEvent(name: string): void {
    void onQueryChange({ ...query, event: query.event === name ? null : name });
  }

  function onEventClose(): void {
    void onQueryChange({ ...query, event: null });
  }

  function onPick(next: string[]): void {
    void goals.pick(next);
  }

  function onShow(next: WebAnalyticsVisitShow): void {
    show = next;
  }

  function onMore(): void {
    if (params) void visits.load(date, params, show, true);
  }

  function onPin(name: string): void {
    pinned = pinned === name ? null : name;
  }

  function onOpen(visit: WebAnalyticsDayVisit): void {
    opened = {
      id: visit.id,
      firstSeen: visit.startedAt,
      lastSeen: visit.lastSeenAt,
      country: visit.country,
      device: visit.device,
      os: visit.os,
      browser: visit.browser,
      source: visit.source,
      sessions: visit.sessions,
      pageviews: visit.pageviews,
      activeDays: [date],
      apps: [],
      identified: visit.identified,
    };
  }

  function onClose(): void {
    opened = null;
  }

  function onView(id: string): void {
    void onQueryChange({
      ...query,
      view: id === insights.views[0]?.id ? null : id,
    });
  }

  function onAdd(): void {
    editing = null;
    editorOpen = true;
  }

  function onEdit(insight: WebAnalyticsInsight): void {
    editing = insight;
    editorOpen = true;
  }

  function onEditorClose(): void {
    editorOpen = false;
  }

  async function onInsightSave(
    config: WebAnalyticsInsightConfig,
    id: string | null,
  ): Promise<void> {
    await insights.save(config, id);
  }

  function onRestore(insight: WebAnalyticsInsight): void {
    void insights.place(insight.id, { hidden: null });
  }

  function onLayout(): void {
    layoutOpen = true;
  }

  function onLayoutClose(): void {
    layoutOpen = false;
  }

  async function onLayoutSave(views: WebAnalyticsViewInput[]): Promise<void> {
    await insights.saveViews(views);
  }

  function stripTitle(): string {
    if (!days.data || days.data.to === today) return 'Last 28 days';
    const from = DateTime.fromISO(days.data.from);
    const to = DateTime.fromISO(days.data.to);
    return `${from.toFormat('d LLL')} to ${to.toFormat('d LLL')}`;
  }

  function visitsTitle(): string {
    if (live) return "Today's visits";
    if (date === addDays(today, -1)) return "Yesterday's visits";
    return `Visits on ${DateTime.fromISO(date).toFormat('ccc d LLL')}`;
  }
</script>

<svelte:document onvisibilitychange={onVisibilityChange} />
<svelte:window onkeydown={onKeydown} />

<div class="@container flex w-full flex-col">
  <ServiceHealthStrip {clusterId} />

  {#if traffic && query.filters.length}
    <div class="edge-b px-4 py-2">
      <ActiveFilters {query} onchange={onQueryChange} />
    </div>
  {/if}

  {#if error}
    <p class="text-error edge-b px-4 py-3 text-sm" role="alert">{error}</p>
  {/if}

  <div class="grid grid-cols-1">
    <div
      class={[
        'col-start-1 row-start-1 flex flex-col gap-2 p-2',
        {
          'max-h-160 overflow-hidden blur-[2px] select-none [mask-image:linear-gradient(to_bottom,black,transparent)]':
            analytics.waitingForData,
        },
      ]}
      inert={analytics.waitingForData}
    >
      {#if ready}
        <InsightsBar
          views={dashboardViews(insights.views)}
          active={view}
          hidden={layout.hidden}
          canAdd={Boolean(insights.insights?.length)}
          onview={onView}
          onrestore={onRestore}
          onlayout={onLayout}
          onadd={onAdd}
        />
      {/if}

      {#if traffic}
        <DaysCard
          days={strip}
          {summary}
          selected={shown}
          goals={params?.goals ?? null}
          spot={days.data?.sources.find((source) => source.name === pinned)
            ?.visits ?? null}
          {now}
          title={stripTitle()}
          onselect={onSelect}
        />
      {/if}

      <InsightsSection
        {clusterId}
        {revision}
        {insights}
        {layout}
        traffic={trafficCard}
        onadd={onAdd}
        onedit={onEdit}
      />
    </div>

    {#if analytics.waitingForData}
      <section
        class="relative z-10 col-start-1 row-start-1 mx-auto w-full max-w-168 self-start px-2 pt-32 pb-10 @xl:px-8"
      >
        <div
          class="bg-surface-elevated-bg edge flex min-w-0 flex-col gap-4 rounded-xl p-5 shadow-2xl"
        >
          <SettingsCardHeader
            title="Start counting visitors"
            description="Add the tracking script to your website. Visits show up here within seconds."
          />
          <WebAnalyticsSetup {clusterId} />
        </div>
      </section>
    {/if}
  </div>
</div>

<VisitorDialog {clusterId} visitor={opened} onclose={onClose} />

<Modal
  isOpen={traffic && query.event !== null}
  onClose={onEventClose}
  aria-labelledby={goalTitleId}
  class="flex w-full max-w-5xl flex-col gap-2 p-2"
>
  <h2 id={goalTitleId} class="sr-only">Goal {goal}</h2>
  {#if goal}
    {#key goal}
      <EventPanel
        {clusterId}
        name={goal}
        {query}
        {range}
        onfilter={onFilter}
        onclose={onEventClose}
      />
    {/key}
  {/if}
</Modal>

<InsightEditor
  {clusterId}
  isOpen={editorOpen}
  insight={editing}
  views={insights.views}
  viewId={view.id}
  onclose={onEditorClose}
  onsave={onInsightSave}
/>

<LayoutDialog
  isOpen={layoutOpen}
  views={insights.views}
  onclose={onLayoutClose}
  onsave={onLayoutSave}
/>

{#snippet trafficCard(id: WebAnalyticsTrafficCard, grip: Snippet)}
  {#if id === 'day'}
    <DayCard
      date={shown}
      inProgress={shownLive}
      {now}
      {headline}
      verdict={focused?.verdict ?? null}
      goals={goals.picked}
      hours={day.data?.hours[0] ?? null}
      typicalHours={day.data ? typicalHours(day.data, since) : null}
      goalHours={day.data?.goalHours ?? []}
      sources={day.data?.sourceHours ?? []}
      {pinned}
      {grip}
      onpin={onPin}
    />
  {:else if id === 'sources'}
    <VisitGroupsCard
      title="Sources"
      column="Source"
      rows={sources}
      {by}
      {weekdays}
      loading={!day.data}
      {pinned}
      {grip}
      onpin={onPin}
    />
  {:else if id === 'firstPages'}
    <VisitGroupsCard
      title="First pages"
      column="First page"
      rows={pages}
      {by}
      {weekdays}
      loading={!day.data}
      {grip}
    />
  {:else if id === 'visits'}
    <DayVisitsCard
      title={visitsTitle()}
      {date}
      visits={visits.visits}
      total={visits.total}
      loading={visits.loading}
      error={visits.error}
      goals={picked}
      {show}
      {live}
      now={clock.toMillis()}
      {grip}
      onshow={onShow}
      onmore={onMore}
      onopen={onOpen}
    />
  {:else if id === 'channels'}
    <BreakdownCard
      {clusterId}
      report={analytics.report}
      {range}
      label="Channels"
      tabs={[
        { id: 'channels', label: 'Channel', filter: 'channel', chart: 'donut' },
        { id: 'sources', label: 'Source', filter: 'source' },
        { id: 'campaigns', label: 'Campaign', filter: 'campaign' },
        { id: 'contents', label: 'Content', filter: 'content' },
        { id: 'keywords', label: 'Keyword', filter: 'keyword' },
        { id: 'referrers', label: 'Referrer', filter: 'referrer' },
      ]}
      {grip}
      onfilter={onFilter}
    />
  {:else if id === 'pages'}
    <BreakdownCard
      {clusterId}
      report={analytics.report}
      {range}
      label="Pages"
      tabs={[
        { id: 'pages', label: 'Page', filter: 'page' },
        { id: 'exitPages', label: 'Exit', title: 'Exit page', filter: 'page' },
        { id: 'hostnames', label: 'Hostname', filter: 'hostname' },
      ]}
      {grip}
      onfilter={onFilter}
    />
  {:else if id === 'goals'}
    <GoalsCard
      report={analytics.report}
      selected={query.event}
      {grip}
      onselect={onEvent}
      onfilter={onFilter}
    />
  {:else if id === 'countries'}
    <BreakdownCard
      {clusterId}
      report={analytics.report}
      {range}
      label="Countries"
      tabs={[{ id: 'countries', label: 'Country', filter: 'country' }]}
      attribution={dbIpAttribution}
      {grip}
      onfilter={onFilter}
    />
  {:else if id === 'technology'}
    <BreakdownCard
      {clusterId}
      report={analytics.report}
      {range}
      label="Technology"
      tabs={[
        { id: 'browsers', label: 'Browser', filter: 'browser' },
        { id: 'os', label: 'OS', filter: 'os' },
        { id: 'devices', label: 'Device', filter: 'device' },
      ]}
      {grip}
      onfilter={onFilter}
    />
  {:else}
    <InsightsCard {clusterId} {range} {grip} />
  {/if}
{/snippet}

{#snippet dbIpAttribution()}
  <a
    href="https://db-ip.com"
    target="_blank"
    rel="noopener"
    class="text-fg-muted hover:text-fg-secondary focus-visible:text-fg-secondary focus-visible:outline-brand transition-ink truncate rounded-sm px-1.5 text-[11px] focus-visible:outline-2"
  >
    <span class="hidden @xs:inline">IP Geolocation by</span>
    DB-IP
  </a>
{/snippet}

{#snippet toolbar()}
  <DayToolbar
    {traffic}
    online={days.data?.online ?? null}
    {date}
    {today}
    first={since}
    days={strip}
    goals={goals.options}
    picked={goals.picked ?? []}
    {query}
    report={analytics.report}
    loading={days.loading || day.loading || analytics.loading}
    onday={onDay}
    onpick={onPick}
    onchange={onQueryChange}
    onfilteropen={loadReport}
    onrefresh={() => refresh(true)}
  />
{/snippet}
