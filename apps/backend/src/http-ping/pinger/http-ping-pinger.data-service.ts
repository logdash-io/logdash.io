import { Injectable } from '@nestjs/common';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';

@Injectable()
export class HttpPingPingerDataService {
  constructor(private readonly httpMonitorReadService: HttpMonitorReadService) {}

  public async readClusterIdsByMonitorIds(monitorIds: string[]): Promise<Record<string, string>> {
    const monitors = await this.httpMonitorReadService.readManyByIds(monitorIds);

    return Object.fromEntries(monitors.map((monitor) => [monitor.id, monitor.clusterId]));
  }
}
