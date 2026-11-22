import {
  readHttpErrorMessage,
  readHttpErrorStatus,
} from '$lib/domains/shared/http/http-error';
import type {
  WebAnalyticsBreakdownName,
  WebAnalyticsBreakdownRow,
  WebAnalyticsInsight,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightPlacement,
  WebAnalyticsInsights,
  WebAnalyticsRange,
  WebAnalyticsReport,
  WebAnalyticsSite,
  WebAnalyticsStatus,
  WebAnalyticsView,
  WebAnalyticsViewInput,
  WebAnalyticsVisitor,
  WebAnalyticsVisitorEvent,
} from '../domain/web-analytics';
import {
  applyArrangement,
  applyTraffic,
  readLayout,
  viewInputs,
  type Arrangement,
} from '../domain/web-analytics-layout';
import { WebAnalyticsService } from '../infrastructure/web-analytics.service';

export class WebAnalyticsDashboardState {
  public report = $state<WebAnalyticsReport | null>(null);
  public site = $state<WebAnalyticsSite | null | undefined>(undefined);
  public status = $state<WebAnalyticsStatus | null>(null);
  public loading = $state(false);
  public error = $state<string | null>(null);
  private generation = 0;

  constructor(private readonly clusterId: string) {}

  public get waitingForData(): boolean {
    return (
      this.site === null ||
      (this.status !== null && !this.status.lastWebEventAt)
    );
  }

  public async load(range: WebAnalyticsRange, goals: string[]): Promise<void> {
    const generation = ++this.generation;
    this.loading = true;
    try {
      const report = await WebAnalyticsService.readReport(
        this.clusterId,
        range,
        goals,
      );
      if (generation !== this.generation) return;
      this.report = report;
      this.error = null;
    } catch (error) {
      if (generation === this.generation)
        this.error =
          readHttpErrorMessage(error) ?? 'Could not load analytics. Try again.';
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }

  public async loadSite(): Promise<void> {
    try {
      const [site, status] = await Promise.all([
        WebAnalyticsService.readSite(this.clusterId),
        WebAnalyticsService.readStatus(this.clusterId),
      ]);
      this.site = site;
      this.status = status;
    } catch {
      this.site = null;
    }
  }
}

export class WebAnalyticsBreakdownState {
  public rows = $state<WebAnalyticsBreakdownRow[]>([]);
  public loading = $state(false);
  public error = $state<string | null>(null);

  constructor(private readonly clusterId: string) {}

  public async load(
    range: WebAnalyticsRange,
    dimension: WebAnalyticsBreakdownName,
  ): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.rows = await WebAnalyticsService.readBreakdown(
        this.clusterId,
        range,
        dimension,
      );
    } catch (error) {
      this.error =
        readHttpErrorMessage(error) ?? 'Could not load the full list.';
    } finally {
      this.loading = false;
    }
  }
}

export class WebAnalyticsVisitorState {
  public visitor = $state<WebAnalyticsVisitor | null>(null);
  public events = $state<WebAnalyticsVisitorEvent[]>([]);
  public loading = $state(false);
  public error = $state<string | null>(null);

  constructor(private readonly clusterId: string) {}

  public async load(visitorId: string, tz: string): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const response = await WebAnalyticsService.readVisitor(
        this.clusterId,
        visitorId,
        tz,
      );
      this.visitor = response.visitor;
      this.events = response.events;
    } catch (error) {
      this.error =
        readHttpErrorMessage(error) ?? 'Could not load this visitor.';
    } finally {
      this.loading = false;
    }
  }
}

export class WebAnalyticsInsightState<T> {
  public data = $state<T | null>(null);
  public loading = $state(false);
  public error = $state<string | null>(null);
  private generation = 0;

  constructor(private readonly read: () => Promise<T>) {}

  public async load(): Promise<void> {
    const generation = ++this.generation;
    this.loading = true;
    try {
      const data = await this.read();
      if (generation !== this.generation) return;
      this.data = data;
      this.error = null;
    } catch (error) {
      if (generation === this.generation)
        this.error =
          readHttpErrorMessage(error) ?? 'Could not load this report.';
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }
}

export class WebAnalyticsInsightsState {
  public views = $state<WebAnalyticsView[]>([]);
  public insights = $state<WebAnalyticsInsight[] | null>(null);
  public error = $state<string | null>(null);
  private sequence = 0;
  private viewsVersion: number | undefined;

  constructor(private readonly clusterId: string) {}

  public async load(): Promise<void> {
    const sequence = this.sequence;
    try {
      const layout = await WebAnalyticsService.readInsights(this.clusterId);
      if (sequence !== this.sequence) return;
      this.take(layout);
      this.error = null;
    } catch (error) {
      this.error =
        readHttpErrorMessage(error) ?? 'Could not load the saved insights.';
    }
  }

  public async save(
    config: WebAnalyticsInsightConfig,
    id: string | null,
  ): Promise<void> {
    const list = this.insights ?? [];
    if (!id) {
      const created = await WebAnalyticsService.createInsight(
        this.clusterId,
        config,
      );
      this.insights = [...list, created];
      return;
    }
    const updated = await WebAnalyticsService.updateInsight(
      this.clusterId,
      id,
      config,
    );
    this.insights = list.map((insight) =>
      insight.id === id ? updated : insight,
    );
  }

  public async saveViews(views: WebAnalyticsViewInput[]): Promise<void> {
    try {
      this.take(
        await WebAnalyticsService.saveViews(
          this.clusterId,
          views,
          this.viewsVersion,
        ),
      );
      this.error = null;
    } catch (error) {
      if (readHttpErrorStatus(error) === 409) await this.load();
      throw error;
    }
  }

  public async orderViews(ids: string[]): Promise<void> {
    const views = ids.flatMap((id) =>
      this.views.filter((view) => view.id === id),
    );
    if (views.length !== this.views.length) return;
    this.views = views;
    try {
      await this.saveViews(viewInputs(views));
    } catch (error) {
      if (readHttpErrorStatus(error) !== 409) await this.load();
      this.error = readHttpErrorMessage(error) ?? 'Could not move the view.';
    }
  }

  public async remove(id: string): Promise<void> {
    try {
      await WebAnalyticsService.deleteInsight(this.clusterId, id);
      this.insights = (this.insights ?? []).filter(
        (insight) => insight.id !== id,
      );
      this.error = null;
    } catch (error) {
      this.error =
        readHttpErrorMessage(error) ?? 'Could not remove the insight.';
    }
  }

  public async place(
    id: string,
    placement: WebAnalyticsInsightPlacement,
  ): Promise<void> {
    await this.arrange({ placements: [{ id, ...placement }] });
  }

  public async arrange(arrangement: Arrangement): Promise<void> {
    if (!this.insights) return;
    if (!arrangement.placements?.length && !arrangement.traffic) return;
    const sequence = ++this.sequence;
    this.insights = applyArrangement(this.insights, arrangement);
    if (arrangement.traffic)
      this.views = applyTraffic(this.views, arrangement.traffic);
    try {
      const layout = await WebAnalyticsService.reorderInsights(
        this.clusterId,
        await this.stored(arrangement),
      );
      if (sequence !== this.sequence) return;
      this.take(layout);
      this.error = null;
    } catch (error) {
      const message =
        readHttpErrorMessage(error) ?? 'Could not update the layout.';
      await this.load();
      this.error = message;
    }
  }

  private async stored(arrangement: Arrangement): Promise<Arrangement> {
    const { traffic } = arrangement;
    if (!traffic || traffic.view) return arrangement;
    this.take(
      await WebAnalyticsService.saveViews(
        this.clusterId,
        viewInputs(this.views),
        this.viewsVersion,
      ),
    );
    const view = this.views[0]?.id ?? '';
    const next = { ...arrangement, traffic: { ...traffic, view } };
    this.insights = applyArrangement(this.insights ?? [], next);
    this.views = applyTraffic(this.views, next.traffic);
    return next;
  }

  private take(layout: Partial<WebAnalyticsInsights>): void {
    const { viewsVersion, views, insights } = readLayout(layout);
    this.viewsVersion = viewsVersion;
    this.views = views;
    this.insights = insights;
  }
}
