import { Inject, Injectable } from '@nestjs/common';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { STATUS_PAGES_LOGGER } from '../../shared/logdash/logdash-tokens';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';
import { PublicDashboardWriteService } from '../write/public-dashboard-write.service';
import { CustomDomainWriteService } from '../../custom-domain/write/custom-domain-write.service';

@Injectable()
export class PublicDashboardRemovalService {
  constructor(
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly publicDashboardWriteService: PublicDashboardWriteService,
    private readonly customDomainWriteService: CustomDomainWriteService,
    @Inject(STATUS_PAGES_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  public async deletePublicDashboardsByClusterId(
    clusterId: string,
    actorUserId?: string,
  ): Promise<void> {
    const publicDashboards = await this.publicDashboardReadService.readByClusterId(clusterId);

    for (const publicDashboard of publicDashboards) {
      await this.deletePublicDashboardById(publicDashboard.id, actorUserId);
    }
  }

  public async deletePublicDashboardById(
    publicDashboardId: string,
    actorUserId?: string,
  ): Promise<void> {
    this.logger.log(`Deleting public dashboard...`, {
      publicDashboardId,
    });

    this.logger.log(`Deleting custom domains for public dashboard...`, {
      publicDashboardId,
    });
    await this.customDomainWriteService.deleteByPublicDashboardId(publicDashboardId);

    this.logger.log(`Deleting public dashboard entity...`, {
      publicDashboardId,
    });
    await this.publicDashboardWriteService.deleteOnlyEntity(publicDashboardId);
  }
}
