import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpPingBucketWriteService } from '../../http-ping-bucket/write/http-ping-bucket-write.service';

@Injectable()
export class HttpPingBucketTtlService {
  constructor(private readonly httpPingBucketWriteService: HttpPingBucketWriteService) {}

  @Cron(CronExpression.EVERY_HOUR)
  public async deleteOldBuckets(): Promise<void> {
    const bucketTtlDays = 90;
    const bucketTtlMs = bucketTtlDays * 24 * 60 * 60 * 1000;

    const cutoffDate = new Date(Date.now() - bucketTtlMs);
    await this.httpPingBucketWriteService.deleteOlderThan(cutoffDate);
  }
}
