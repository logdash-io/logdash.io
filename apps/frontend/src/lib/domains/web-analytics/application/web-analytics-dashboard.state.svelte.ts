import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
import type {
  WebAnalyticsBreakdownName,
  WebAnalyticsBreakdownRow,
  WebAnalyticsRange,
  WebAnalyticsReport,
  WebAnalyticsSite,
  WebAnalyticsStatus,
  WebAnalyticsVisitor,
  WebAnalyticsVisitorEvent,
} from '../domain/web-analytics';
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

  public async load(range: WebAnalyticsRange): Promise<void> {
    const generation = ++this.generation;
    this.loading = true;
    try {
      const report = await WebAnalyticsService.readReport(
        this.clusterId,
        range,
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

export class WebAnalyticsVisitorsState {
  public visitors = $state<WebAnalyticsVisitor[]>([]);
  public total = $state(0);
  public loading = $state(false);
  public error = $state<string | null>(null);
  private generation = 0;

  constructor(private readonly clusterId: string) {}

  public async load(range: WebAnalyticsRange, append = false): Promise<void> {
    const generation = ++this.generation;
    this.loading = true;
    try {
      const page = await WebAnalyticsService.readVisitors(
        this.clusterId,
        range,
        append ? this.visitors.length : 0,
      );
      if (generation !== this.generation) return;
      this.visitors = append
        ? [...this.visitors, ...page.visitors]
        : page.visitors;
      this.total = page.total;
      this.error = null;
    } catch (error) {
      if (generation === this.generation)
        this.error = readHttpErrorMessage(error) ?? 'Could not load visitors.';
    } finally {
      if (generation === this.generation) this.loading = false;
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
