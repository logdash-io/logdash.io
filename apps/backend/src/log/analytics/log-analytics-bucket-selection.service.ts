import { Injectable } from '@nestjs/common';
import { LogAnalyticsBucket } from './dto/log-analytics-query.dto';

@Injectable()
export class LogAnalyticsBucketSelectionService {
  private readonly MAX_BUCKETS = 30;

  private readonly AVAILABLE_BUCKET_SIZES = [
    LogAnalyticsBucket.OneMinute,
    LogAnalyticsBucket.FiveMinutes,
    LogAnalyticsBucket.TenMinutes,
    LogAnalyticsBucket.FifteenMinutes,
    LogAnalyticsBucket.TwentyMinutes,
    LogAnalyticsBucket.ThirtyMinutes,
    LogAnalyticsBucket.OneHour,
    LogAnalyticsBucket.TwoHours,
    LogAnalyticsBucket.FourHours,
    LogAnalyticsBucket.EightHours,
    LogAnalyticsBucket.TwelveHours,
    LogAnalyticsBucket.TwentyFourHours,
  ];

  public selectOptimalBucketSize(startDate: Date, endDate: Date): LogAnalyticsBucket {
    const totalMinutes = this.calculateTotalMinutes(startDate, endDate);
    const minimumBucketSize = Math.ceil(totalMinutes / this.MAX_BUCKETS);

    return this.findSmallestSuitableBucketSize(minimumBucketSize);
  }

  public calculateExpectedBucketCount(
    startDate: Date,
    endDate: Date,
    bucketSize: LogAnalyticsBucket,
  ): number {
    const totalMinutes = this.calculateTotalMinutes(startDate, endDate);
    return Math.ceil(totalMinutes / bucketSize);
  }

  private calculateTotalMinutes(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffMs / (1000 * 60)); // Convert to minutes and round up
  }

  private findSmallestSuitableBucketSize(minimumBucketSize: number): LogAnalyticsBucket {
    for (const bucketSize of this.AVAILABLE_BUCKET_SIZES) {
      if (bucketSize >= minimumBucketSize) {
        return bucketSize;
      }
    }

    // If even the largest bucket size is too small, return the largest one
    return this.AVAILABLE_BUCKET_SIZES[this.AVAILABLE_BUCKET_SIZES.length - 1];
  }
}
