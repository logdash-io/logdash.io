import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { HttpMonitorStatus } from './enum/http-monitor-status.enum';

const HTTP_MONITOR_STATUS_TTL_SECONDS = 360;

@Injectable()
export class HttpMonitorStatusService {
  constructor(private readonly redisService: RedisService) {}

  private getRedisKey(httpMonitorId: string): string {
    return `http-monitor:${httpMonitorId}:status`;
  }

  public async getStatuses(httpMonitorIds: string[]): Promise<Record<string, HttpMonitorStatus>> {
    const statuses = await this.redisService.mGet(httpMonitorIds.map((id) => this.getRedisKey(id)));

    return httpMonitorIds.reduce(
      (acc, id) => {
        acc[id] =
          (statuses[this.getRedisKey(id)] as HttpMonitorStatus) || HttpMonitorStatus.Unknown;
        return acc;
      },
      {} as Record<string, HttpMonitorStatus>,
    );
  }

  public async getStatus(httpMonitorId: string): Promise<HttpMonitorStatus> {
    const status = await this.redisService.get(this.getRedisKey(httpMonitorId));

    if (!status) {
      return HttpMonitorStatus.Unknown;
    }

    return status as HttpMonitorStatus;
  }

  public async setStatus(httpMonitorId: string, status: HttpMonitorStatus) {
    await this.redisService.set(
      this.getRedisKey(httpMonitorId),
      status,
      HTTP_MONITOR_STATUS_TTL_SECONDS,
    );
  }
}
