import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpPingWriteService } from '../write/http-ping-write.service';

@Injectable()
export class HttpPingTtlService {
  private readonly ONE_HOUR_MS = 60 * 60 * 1000;

  constructor(private readonly httpPingWriteService: HttpPingWriteService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async deleteOldPings(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - this.ONE_HOUR_MS);
    await this.httpPingWriteService.deleteOlderThan(oneHourAgo);
  }
}
