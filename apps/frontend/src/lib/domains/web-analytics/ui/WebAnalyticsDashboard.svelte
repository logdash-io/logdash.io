<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import ServiceHealthStrip from '$lib/domains/app/clusters/ui/ServiceHealthStrip.svelte';
  import { SettingsCardHeader } from '$lib/domains/shared/ui/components/settings-card';
  import { DateTime } from 'luxon';
  import { onMount, untrack } from 'svelte';
  import {
    WebAnalyticsCachedState,
    WebAnalyticsDayVisitsState,
    WebAnalyticsGoalsState,
  } from '../application/day-analytics.state.svelte';
  import { WebAnalyticsDashboardState } from '../application/web-analytics-dashboard.state.svelte';
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
    WebAnalyticsVisitor,
    WebAnalyticsVisitShow,
  } from '../domain/web-analytics';
  import { WebAnalyticsService } from '../infrastructure/web-analytics.service';
  import ActiveFilters from './ActiveFilters.svelte';
  import DayCard from './day/DayCard.svelte';
  import DayDetails from './day/DayDetails.svelte';
  import DaysCard from './day/DaysCard.svelte';
  import DayToolbar from './day/DayToolbar.svelte';
  import DayVisitsCard from './day/DayVisitsCard.svelte';
  import VisitGroupsCard from './day/VisitGroupsCard.svelte';
  import VisitorDialog from './insights/VisitorDialog.svelte';
  import WebAnalyticsSetup from './WebAnalyticsSetup.svelte';

  type Props = { clusterId: string };
  const { clusterId }: Props = $props();

  const STRIP_DAYS = 28;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const analytics = new WebAnalyticsDashboardState(untrack(() => clusterId));
  const goals = new WebAnalyticsGoalsState(untrack(() => clusterId));
  const days = new WebAnalyticsCachedState<WebAnalyticsDays>();
  const day = new WebAnalyticsCachedState<WebAnalyticsDay>();
  const visits = new WebAnalyticsDayVisitsState(untrack(() => clusterId));

  let clock = $state(DateTime.local());
  let show = $state<WebAnalyticsVisitShow>('all');
  let hovered = $state<string | null>(null);
  let pinned = $state<string | null>(null);
  let detailsOpen = $state(false);
  let opened = $state<WebAnalyticsVisitor | null>(null);
  let details = $state<HTMLElement>();
  let reportKey = '';

  const query = $derived(parseAnalyticsQuery(page.url.searchParams));
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
  const now = $derived(clock.toFormat('HH:mm'));
  const stripEnd = $derived(
    addDays(
      today,
      -Math.floor(daysBetween(date, today) / STRIP_DAYS) * STRIP_DAYS,
    ),
  );
  const filterKey = $derived(
    analyticsSearch({ day: null, filters: query.filters, event: null }),
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
  const selected = $derived(strip.find((entry) => entry.date === date) ?? null);
  const sources = $derived(
    day.data ? groupRows(day.data.sources, day.data.dates, since) : [],
  );
  const pages = $derived(
    day.data ? groupRows(day.data.pages, day.data.dates, since) : [],
  );
  const spot = $derived(hovered ?? pinned);
  const headline = $derived(
    selected && day.data?.date === date
      ? dayHeadline({
          date,
          inProgress: live,
          time: now,
          verdict: selected.verdict,
          goals: picked,
          sources,
          record: isRecord(strip, date),
        })
      : null,
  );
  const by = $derived(live ? ` by ${now}` : '');
  const weekdays = $derived(`${DateTime.fromISO(date).toFormat('cccc')}s`);
  const range = $derived(dayRange(date, tz, query.filters));
  const error = $derived(
    days.error ?? day.error ?? goals.error ?? analytics.error,
  );

  $effect(() => topBarState.show(toolbar));

  onMount(() => {
    void analytics.loadSite();
    void goals.load(tz);
    const timer = setInterval(onTick, 60_000);
    return () => clearInterval(timer);
  });

  $effect(() => {
    if (!params) return;
    const end = stripEnd;
    const current = params;
    untrack(() => loadDays(end, current, end === today));
  });

  $effect(() => {
    if (!params || (query.day && !days.data)) return;
    const at = date;
    const current = params;
    untrack(() => {
      void loadDay(at, current, at === today);
      void prefetch(addDays(at, -1));
    });
  });

  $effect(() => {
    if (!params || (query.day && !days.data)) return;
    const at = date;
    const current = params;
    const shown = show;
    untrack(() => void visits.load(at, current, shown));
  });

  $effect(() => {
    if (query.event) untrack(() => (detailsOpen = true));
  });

  $effect(() => {
    if (!detailsOpen) return;
    void range;
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
    const key = JSON.stringify(range);
    if (key === reportKey) return;
    reportKey = key;
    void analytics.load(range);
  }

  function refresh(force = false): void {
    void analytics.loadSite();
    if (goals.error) void goals.load(tz);
    if (!params) return;
    loadDays(stripEnd, params, true);
    if (!live && !force) return;
    void loadDay(date, params, true);
    void visits.refresh(date, params, show);
    if (detailsOpen) {
      reportKey = '';
      loadReport();
    }
  }

  function onTick(): void {
    clock = DateTime.local();
    if (!document.hidden) refresh();
  }

  function onVisibilityChange(): void {
    if (!document.hidden) onTick();
  }

  function onQueryChange(next: AnalyticsQuery): void {
    void goto(resolve(`/app/domains/${clusterId}${analyticsSearch(next)}`), {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }

  function onDay(next: string): void {
    if (next > today || !since || next < since) return;
    onQueryChange({ ...query, day: next === today ? null : next });
  }

  function onKeydown(event: KeyboardEvent): void {
    if (
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
    onDay(addDays(date, event.key === 'ArrowLeft' ? -1 : 1));
  }

  function onFilter(filter: WebAnalyticsFilter): void {
    onQueryChange(withFilter(query, filter));
  }

  function onEvent(name: string): void {
    onQueryChange({ ...query, event: query.event === name ? null : name });
    details?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function onEventClose(): void {
    onQueryChange({ ...query, event: null });
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

  function onHover(name: string | null): void {
    hovered = name;
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

  {#if query.filters.length}
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
      {#if strip.length}
        <DaysCard
          days={strip}
          {summary}
          selected={date}
          goals={picked}
          spot={days.data?.sources.find((source) => source.name === spot)
            ?.visits ?? null}
          {now}
          title={stripTitle()}
          onselect={onDay}
          onprefetch={prefetch}
        />
      {:else}
        <div class="bg-surface-25-bg h-90 rounded-2xl p-2" aria-hidden="true">
          <div class="bg-surface-150-bg h-full rounded-xl"></div>
        </div>
      {/if}

      <DayCard
        {date}
        inProgress={live}
        {now}
        {headline}
        verdict={selected?.verdict ?? null}
        goals={picked}
        hours={day.data?.hours[0] ?? null}
        typicalHours={day.data ? typicalHours(day.data, since) : null}
        goalHours={day.data?.goalHours ?? []}
        sources={day.data?.sourceHours ?? []}
        {spot}
        {pinned}
        onhover={onHover}
        onpin={onPin}
      />

      <VisitGroupsCard
        title="Sources"
        column="Source"
        rows={sources}
        {by}
        {weekdays}
        loading={!day.data}
        {spot}
        {pinned}
        onhover={onHover}
        onpin={onPin}
      />

      <VisitGroupsCard
        title="Landing pages"
        column="Landing page"
        rows={pages}
        {by}
        {weekdays}
        loading={!day.data}
      />

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
        onshow={onShow}
        onmore={onMore}
        onopen={onOpen}
        onhover={onHover}
      />

      <div bind:this={details} class="scroll-mt-2">
        <DayDetails
          {clusterId}
          report={analytics.report}
          {range}
          {query}
          bind:open={detailsOpen}
          onfilter={onFilter}
          onevent={onEvent}
          oneventclose={onEventClose}
        />
      </div>
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

{#snippet toolbar()}
  <DayToolbar
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
