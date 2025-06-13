import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subDays } from 'date-fns';
import { HttpPingBucketWriteService } from '../../http-ping-bucket/write/http-ping-bucket-write.service';

@Injectable()
export class HttpPingBucketTtlService {
  constructor(private readonly httpPingBucketWriteService: HttpPingBucketWriteService) {}

  @Cron(CronExpression.EVERY_HOUR)
  public async deleteOldBuckets(): Promise<void> {
    const bucketTtlDays = 90;
    const cutoffDate = subDays(new Date(), bucketTtlDays);
    await this.httpPingBucketWriteService.deleteOlderThan(cutoffDate);
  }
}
