import { Injectable } from '@nestjs/common';
import { HttpMonitorWriteService } from '../write/http-monitor-write.service';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { HttpPingWriteService } from '../../http-ping/write/http-ping-write.service';
import { HttpPingBucketWriteService } from '../../http-ping-bucket/write/http-ping-bucket-write.service';
import { PublicDashboardMonitorsService } from '../../public-dashboard/monitors/public-dashboard-monitors.service';

@Injectable()
export class HttpMonitorRemovalService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorWriteService: HttpMonitorWriteService,
    private readonly httpPingWriteService: HttpPingWriteService,
    private readonly httpBucketWriteService: HttpPingBucketWriteService,
    private readonly publicDashboardMonitorsService: PublicDashboardMonitorsService,
  ) {}

  public async deleteByClusterId(clusterId: string, actorUserId?: string): Promise<void> {
    const monitors = await this.httpMonitorReadService.readByClusterId(clusterId);
    const monitorsIds = monitors.map((monitor) => monitor.id);

    if (monitorsIds.length > 0) {
      await this.httpPingWriteService.deleteByMonitorIds(monitorsIds);
      await this.httpMonitorWriteService.deleteByClusterId(clusterId, actorUserId);
      await this.httpBucketWriteService.deleteByMonitorIds(monitorsIds);
    }
  }

  public async deleteById(httpMonitorId: string, actorUserId?: string): Promise<void> {
    await this.httpPingWriteService.deleteByMonitorIds([httpMonitorId]);
    await this.httpMonitorWriteService.deleteById(httpMonitorId, actorUserId);
    await this.httpBucketWriteService.deleteByMonitorIds([httpMonitorId]);
    await this.publicDashboardMonitorsService.removeMonitor(httpMonitorId);
  }
}
