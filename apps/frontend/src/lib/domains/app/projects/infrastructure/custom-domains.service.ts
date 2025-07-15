import { httpClient } from '$lib/domains/shared/http/http-client';
import type {
  CustomDomain,
  CreateCustomDomainDTO,
} from '$lib/domains/app/projects/domain/public-dashboards/custom-domain';

export class CustomDomainsService {
  public async createCustomDomain(
    publicDashboardId: string,
    dto: CreateCustomDomainDTO,
  ): Promise<CustomDomain> {
    return httpClient.post<CustomDomain>(
      `/public_dashboards/${publicDashboardId}/custom_domains`,
      dto,
    );
  }

  public async getCustomDomain(
    publicDashboardId: string,
  ): Promise<CustomDomain | null> {
    try {
      return await httpClient.get<CustomDomain>(
        `/public_dashboards/${publicDashboardId}/custom_domain`,
      );
    } catch (error) {
      // If no custom domain exists, return null
      return null;
    }
  }

  public async deleteCustomDomain(customDomainId: string): Promise<void> {
    return httpClient.delete(`/custom_domains/${customDomainId}`);
  }
}

export const customDomainsService = new CustomDomainsService();
