import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service';
import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
import { envConfig } from '$lib/domains/shared/utils/env-config';
import type {
  WebAnalyticsSite,
  WebAnalyticsStatus,
} from '../domain/web-analytics';
import { generateWebAnalyticsSetupPrompt } from '../domain/web-analytics-setup-prompt';
import { WebAnalyticsService } from '../infrastructure/web-analytics.service';

export class WebAnalyticsSetupState {
  public site = $state<WebAnalyticsSite | null>(null);
  public status = $state<WebAnalyticsStatus | null>(null);
  public loading = $state(true);
  public error = $state<string | null>(null);
  private clusterId = '';
  private generation = 0;

  public async load(clusterId: string): Promise<void> {
    const generation = ++this.generation;
    this.clusterId = clusterId;
    this.site = null;
    this.status = null;
    this.error = null;
    this.loading = true;
    try {
      const [site, status] = await Promise.all([
        WebAnalyticsService.readSite(clusterId),
        WebAnalyticsService.readStatus(clusterId),
      ]);
      if (generation !== this.generation) return;
      this.site = site;
      this.status = status;
    } catch (error) {
      if (generation === this.generation)
        this.error =
          readHttpErrorMessage(error) ?? 'Could not load the tracking setup.';
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }

  public async saveOrigins(origins: string[]): Promise<void> {
    const generation = this.generation;
    const site = await WebAnalyticsService.configure(this.clusterId, origins);
    if (generation === this.generation) this.site = site;
  }

  public async refreshStatus(): Promise<void> {
    const generation = this.generation;
    if (!this.clusterId) return;
    try {
      const status = await WebAnalyticsService.readStatus(this.clusterId);
      if (generation === this.generation) this.status = status;
    } catch {
      return;
    }
  }

  public async buildPrompt(
    services: { id: string; name: string }[],
    scriptBaseUrl: string,
  ): Promise<string> {
    if (!this.site) throw new Error('Start tracking first.');
    const { id, origins } = this.site;
    const apiKeys = await Promise.all(
      services.map((service) => ProjectsService.getApiKey(service.id)),
    );
    return generateWebAnalyticsSetupPrompt({
      services: services.map((service, index) => ({
        name: service.name,
        apiKey: apiKeys[index],
      })),
      siteId: id,
      origins,
      apiBaseUrl: envConfig.apiBaseUrl,
      scriptBaseUrl,
    });
  }
}
