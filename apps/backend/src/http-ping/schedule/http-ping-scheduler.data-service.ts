import { Injectable } from '@nestjs/common';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { ProjectReadService } from '../../project/read/project-read.service';
import { Brand } from '../../shared/types/brand';

type MonitorId = Brand<string, 'MonitorId'>;
type ProjectId = Brand<string, 'ProjectId'>;
type ClusterId = Brand<string, 'ClusterId'>;

@Injectable()
export class HttpPingSchedulerDataService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly projectReadService: ProjectReadService,
  ) {}

  public async readClusterIdsByMonitorIds(
    monitorIds: string[],
  ): Promise<Record<MonitorId, ClusterId>> {
    const monitors = await this.httpMonitorReadService.readManyByIds(monitorIds);
    const projectsIds = [...new Set(monitors.map((monitor) => monitor.projectId))] as ProjectId[];
    const projects = await this.projectReadService.readManyByIds(projectsIds);

    const clustersIds = Object.fromEntries(
      projects.map((project) => [project.id, project.clusterId]),
    ) as Record<ProjectId, ClusterId>;

    return Object.fromEntries(
      monitors.map((monitor) => [monitor.id, clustersIds[monitor.projectId as ProjectId]]),
    ) as Record<MonitorId, ClusterId>;
  }
}
