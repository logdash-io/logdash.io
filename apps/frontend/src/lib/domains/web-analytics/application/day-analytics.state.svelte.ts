import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
import { visitKey } from '../domain/day-analytics';
import type {
  WebAnalyticsDayParams,
  WebAnalyticsDayVisit,
  WebAnalyticsGoalOption,
  WebAnalyticsVisitShow,
} from '../domain/web-analytics';
import { WebAnalyticsService } from '../infrastructure/web-analytics.service';

export class WebAnalyticsCachedState<T> {
  public data = $state<T | null>(null);
  public loading = $state(false);
  public error = $state<string | null>(null);
  private readonly cache: Record<string, T> = {};
  private readonly pending: Record<string, Promise<T>> = {};
  private generation = 0;

  public async load(
    key: string,
    read: () => Promise<T>,
    revalidate: boolean,
  ): Promise<void> {
    const generation = ++this.generation;
    const cached = this.cache[key];
    if (cached) {
      this.data = cached;
      this.error = null;
    }
    if (cached && !revalidate) {
      this.loading = false;
      return;
    }
    this.loading = true;
    try {
      const data = await this.fetch(key, read);
      if (generation !== this.generation) return;
      this.data = data;
      this.error = null;
    } catch (error) {
      if (generation === this.generation)
        this.error =
          readHttpErrorMessage(error) ?? 'Could not load analytics. Try again.';
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }

  public async prefetch(key: string, read: () => Promise<T>): Promise<void> {
    if (key in this.cache) return;
    try {
      await this.fetch(key, read);
    } catch {
      return;
    }
  }

  private async fetch(key: string, read: () => Promise<T>): Promise<T> {
    this.pending[key] ??= read().finally(() => delete this.pending[key]);
    const data = await this.pending[key];
    this.cache[key] = data;
    return data;
  }
}

export class WebAnalyticsDayVisitsState {
  public visits = $state<WebAnalyticsDayVisit[]>([]);
  public total = $state(0);
  public loading = $state(false);
  public error = $state<string | null>(null);
  private generation = 0;

  constructor(private readonly clusterId: string) {}

  public async load(
    date: string,
    params: WebAnalyticsDayParams,
    show: WebAnalyticsVisitShow,
    append = false,
  ): Promise<void> {
    const generation = ++this.generation;
    this.loading = true;
    try {
      const page = await WebAnalyticsService.readDayVisits(
        this.clusterId,
        date,
        params,
        show,
        append ? this.visits.length : 0,
      );
      if (generation !== this.generation) return;
      const shown = this.visits.map(visitKey);
      this.visits = append
        ? [
            ...this.visits,
            ...page.visits.filter((visit) => !shown.includes(visitKey(visit))),
          ]
        : page.visits;
      this.total = page.total;
      this.error = null;
    } catch (error) {
      if (generation === this.generation)
        this.error = readHttpErrorMessage(error) ?? 'Could not load visits.';
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }

  public async refresh(
    date: string,
    params: WebAnalyticsDayParams,
    show: WebAnalyticsVisitShow,
  ): Promise<void> {
    const generation = this.generation;
    try {
      const page = await WebAnalyticsService.readDayVisits(
        this.clusterId,
        date,
        params,
        show,
        0,
      );
      if (generation !== this.generation) return;
      const fresh = page.visits.map(visitKey);
      this.visits = [
        ...page.visits,
        ...this.visits.filter((visit) => !fresh.includes(visitKey(visit))),
      ];
      this.total = page.total;
    } catch {
      return;
    }
  }
}

export class WebAnalyticsGoalsState {
  public options = $state<WebAnalyticsGoalOption[]>([]);
  public picked = $state<string[] | null>(null);
  public error = $state<string | null>(null);
  private loaded = false;

  constructor(private readonly clusterId: string) {}

  public async load(tz: string): Promise<void> {
    try {
      const goals = await WebAnalyticsService.readGoals(this.clusterId, tz);
      this.options = goals.goals;
      if (!this.loaded) this.picked = goals.picked;
      this.loaded = true;
      this.error = null;
    } catch (error) {
      this.picked ??= [];
      this.error = readHttpErrorMessage(error) ?? 'Could not load goals.';
    }
  }

  public async pick(goals: string[]): Promise<void> {
    const previous = this.picked;
    this.picked = goals;
    try {
      await WebAnalyticsService.saveGoals(this.clusterId, goals);
      this.error = null;
    } catch (error) {
      this.picked = previous;
      this.error = readHttpErrorMessage(error) ?? 'Could not save the goals.';
    }
  }
}
