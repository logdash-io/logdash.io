import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { HttpMonitorStatus } from './enum/http-monitor-status.enum';

const HTTP_MONITOR_STATUS_TTL_SECONDS = 360;

export interface HttpMonitorStatusDto {
  status: HttpMonitorStatus;
  statusCode: string;
}

@Injectable()
export class HttpMonitorStatusService {
  constructor(private readonly redisService: RedisService) {}

  private getRedisKey(httpMonitorId: string): string {
    return `http-monitor:${httpMonitorId}:status`;
  }

  public async getStatuses(
    httpMonitorIds: string[],
  ): Promise<Record<string, HttpMonitorStatusDto>> {
    const statuses = await this.redisService.mGet(httpMonitorIds.map((id) => this.getRedisKey(id)));

    return httpMonitorIds.reduce(
      (acc, id) => {
        const statusStringified = statuses[this.getRedisKey(id)];

        if (!statusStringified) {
          acc[id] = {
            status: HttpMonitorStatus.Unknown,
            statusCode: '0',
          };

          return acc;
        }

        const status: HttpMonitorStatusDto = JSON.parse(statusStringified);

        acc[id] = {
          status: status.status || HttpMonitorStatus.Unknown,
          statusCode: status.statusCode || '0',
        };
        return acc;
      },
      {} as Record<string, HttpMonitorStatusDto>,
    );
  }

  public async getStatus(httpMonitorId: string): Promise<HttpMonitorStatusDto> {
    const status = await this.redisService.get(this.getRedisKey(httpMonitorId));

    if (!status) {
      return {
        status: HttpMonitorStatus.Unknown,
        statusCode: '0',
      };
    }

    return status as unknown as HttpMonitorStatusDto;
  }

  public async setStatus(httpMonitorId: string, dto: HttpMonitorStatusDto) {
    await this.redisService.set(
      this.getRedisKey(httpMonitorId),
      JSON.stringify(dto),
      HTTP_MONITOR_STATUS_TTL_SECONDS,
    );
  }
}
