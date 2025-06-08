import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpPingWriteService } from '../write/http-ping-write.service';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Injectable()
export class HttpPingTtlService {
  constructor(private readonly httpPingWriteService: HttpPingWriteService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async deleteOldPings(): Promise<void> {
    const ttlHours = getEnvConfig().pings.ttlHours;
    const ttlMs = ttlHours * 60 * 60 * 1000;

    const cutoffDate = new Date(Date.now() - ttlMs);
    await this.httpPingWriteService.deleteOlderThan(cutoffDate);
  }
}
