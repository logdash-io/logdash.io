import type {
  CustomDomain,
  CreateCustomDomainDTO,
} from '$lib/domains/app/projects/domain/public-dashboards/custom-domain';
import { customDomainsService } from '$lib/domains/app/projects/infrastructure/custom-domains.service';
import { isAxiosError } from 'axios';

export class CustomDomainsState {
  private _customDomains = $state<Record<string, CustomDomain | null>>({});
  private _loading = $state<Record<string, boolean>>({});
  private _error = $state<string | null>(null);
  private _pollingTimers = $state<Record<string, number>>({});

  public getCustomDomain(publicDashboardId: string): CustomDomain | null {
    return this._customDomains[publicDashboardId] || null;
  }

  public hasLoaded(publicDashboardId: string): boolean {
    return publicDashboardId in this._customDomains;
  }

  public isLoading(publicDashboardId: string): boolean {
    return this._loading[publicDashboardId] || false;
  }

  public get error(): string | null {
    return this._error;
  }

  public getPollingTimer(publicDashboardId: string): number {
    return this._pollingTimers[publicDashboardId] || 0;
  }

  public async manualCheck(publicDashboardId: string): Promise<void> {
    await this.loadCustomDomain(publicDashboardId);
    this._resetPollingTimer(publicDashboardId);
  }

  public async loadCustomDomain(publicDashboardId: string): Promise<void> {
    try {
      this._loading[publicDashboardId] = true;
      this._clearError();

      const customDomain =
        await customDomainsService.getCustomDomain(publicDashboardId);
      this._customDomains[publicDashboardId] = customDomain;
    } catch (error) {
      this._setError(
        error instanceof Error ? error.message : 'Failed to load custom domain',
      );
      console.error('Failed to load custom domain:', error);
    } finally {
      this._loading[publicDashboardId] = false;
    }
  }

  public async createCustomDomain(
    publicDashboardId: string,
    dto: CreateCustomDomainDTO,
  ): Promise<void> {
    try {
      this._loading[publicDashboardId] = true;
      this._clearError();

      const customDomain = await customDomainsService.createCustomDomain(
        publicDashboardId,
        dto,
      );
      this._customDomains[publicDashboardId] = customDomain;
    } catch (error) {
      this._setError(this._readCreateErrorMessage(error));
      console.error('Failed to create custom domain:', error);
      throw error;
    } finally {
      this._loading[publicDashboardId] = false;
    }
  }

  public async deleteCustomDomain(publicDashboardId: string): Promise<void> {
    const customDomain = this._customDomains[publicDashboardId];
    if (!customDomain) return;

    try {
      this._loading[publicDashboardId] = true;
      this._clearError();

      await customDomainsService.deleteCustomDomain(customDomain.id);
      this._customDomains[publicDashboardId] = null;
      // Error is automatically cleared since operation succeeded
    } catch (error) {
      this._setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete custom domain',
      );
      console.error('Failed to delete custom domain:', error);
      throw error;
    } finally {
      this._loading[publicDashboardId] = false;
    }
  }

  private _readCreateErrorMessage(error: unknown): string {
    if (!isAxiosError<{ message?: string | string[] }>(error)) {
      return 'Failed to create custom domain';
    }

    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message[0];
    }

    return message ?? 'Failed to create custom domain';
  }

  private _clearError(): void {
    this._error = null;
  }

  private _setError(message: string): void {
    this._error = message;
  }

  private _resetPollingTimer(publicDashboardId: string): void {
    this._pollingTimers[publicDashboardId] = 5;
  }

  public startStatusPolling(publicDashboardId: string): (() => void) | null {
    const customDomain = this._customDomains[publicDashboardId];

    if (!customDomain || customDomain.status !== 'verifying') {
      return null;
    }

    this._resetPollingTimer(publicDashboardId);

    const timerInterval = setInterval(() => {
      this._pollingTimers[publicDashboardId] = Math.max(
        0,
        this._pollingTimers[publicDashboardId] - 1,
      );
    }, 1000);

    const pollingInterval = setInterval(() => {
      void this.manualCheck(publicDashboardId);
    }, 5000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollingInterval);
      this._pollingTimers[publicDashboardId] = 0;
    };
  }
}

export const customDomainsState = new CustomDomainsState();
