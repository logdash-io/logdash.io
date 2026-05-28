import { Injectable } from '@nestjs/common';
import { LogReadService } from '../../log/read/log-read.service';
import { LogLevel } from '../../log/core/enums/log-level.enum';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpMonitorStatusService } from '../../http-monitor/status/http-monitor-status.service';
import { HttpMonitorStatus } from '../../http-monitor/status/enum/http-monitor-status.enum';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { ProjectReadService } from '../../project/read/project-read.service';
import { ProjectNormalized } from '../../project/core/entities/project.interface';
import {
  MonitorStatusEntry,
  OverviewResponse,
  ProjectDataFlow,
  ProjectErrorCount,
} from '../core/dto/overview.response';

// "error/fatal" maps to the single error level the platform records today.
const ERROR_LEVELS = [LogLevel.Error];

@Injectable()
export class OverviewReadService {
  constructor(
    private readonly logReadService: LogReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorStatusService: HttpMonitorStatusService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly projectReadService: ProjectReadService,
  ) {}

  /**
   * Build the overview verdict for an explicit set of projects. All three
   * levels (account / cluster / project) call this with a different project
   * set — the shape is identical, only the scope narrows.
   */
  public async buildForProjects(dto: {
    projects: ProjectNormalized[];
    since: Date;
  }): Promise<OverviewResponse> {
    const { projects, since } = dto;
    const projectIds = projects.map((p) => p.id);
    const nameById = new Map(projects.map((p) => [p.id, p.name]));

    const [errors, monitors, dataFlow] = await Promise.all([
      this.buildErrors(projects, since),
      this.buildMonitors(projectIds, nameById),
      this.buildDataFlow(projects),
    ]);

    const monitorsDown = monitors.filter((m) => m.status === HttpMonitorStatus.Down).length;

    return {
      since: since.toISOString(),
      errors,
      monitors,
      monitorsDown,
      dataFlow,
    };
  }

  private async buildErrors(
    projects: ProjectNormalized[],
    since: Date,
  ): Promise<ProjectErrorCount[]> {
    const counts = await Promise.all(
      projects.map(async (project) => ({
        projectId: project.id,
        projectName: project.name,
        errorCount: await this.logReadService.countByLevelsSince({
          projectId: project.id,
          levels: ERROR_LEVELS,
          since,
        }),
      })),
    );

    // worst (highest error count) first
    return counts.sort((a, b) => b.errorCount - a.errorCount);
  }

  private async buildMonitors(
    projectIds: string[],
    nameById: Map<string, string>,
  ): Promise<MonitorStatusEntry[]> {
    if (projectIds.length === 0) {
      return [];
    }

    const monitors = await this.httpMonitorReadService.readClaimedByProjectIds(projectIds);

    if (monitors.length === 0) {
      return [];
    }

    const statuses = await this.httpMonitorStatusService.getStatuses(monitors.map((m) => m.id));

    const entries: MonitorStatusEntry[] = monitors.map((monitor) => ({
      monitorId: monitor.id,
      monitorName: monitor.name,
      projectId: monitor.projectId,
      status: statuses[monitor.id]?.status ?? HttpMonitorStatus.Unknown,
    }));

    // currently-down monitors first, so the CLI can lead with the bad news
    const rank = (status: HttpMonitorStatus): number => {
      if (status === HttpMonitorStatus.Down) return 0;
      if (status === HttpMonitorStatus.Unknown) return 1;
      return 2;
    };

    return entries.sort((a, b) => rank(a.status) - rank(b.status));
  }

  private async buildDataFlow(projects: ProjectNormalized[]): Promise<ProjectDataFlow[]> {
    return Promise.all(
      projects.map(async (project) => {
        const [lastLogReceivedAt, lastMetricReceivedAt] = await Promise.all([
          this.logReadService.getLastLogReceivedAt(project.id),
          this.metricRegisterReadService.getLastMetricReceivedAt(project.id),
        ]);

        return {
          projectId: project.id,
          projectName: project.name,
          lastLogReceivedAt: lastLogReceivedAt ? lastLogReceivedAt.toISOString() : null,
          lastMetricReceivedAt: lastMetricReceivedAt ? lastMetricReceivedAt.toISOString() : null,
        };
      }),
    );
  }
}
