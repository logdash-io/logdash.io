import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';
import { PublicDashboardWriteService } from '../write/public-dashboard-write.service';
import { CustomDomainWriteService } from '../../custom-domain/write/custom-domain-write.service';

@Injectable()
export class PublicDashboardRemovalService {
  constructor(
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly publicDashboardWriteService: PublicDashboardWriteService,
    private readonly customDomainWriteService: CustomDomainWriteService,
    private readonly logger: Logger,
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
