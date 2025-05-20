import { Injectable } from '@nestjs/common';
import { MetricGranularity } from '../enums/metric-granularity.enum';
import { Bucket } from './models/bucket';

@Injectable()
export class MetricBucketingService {
  public static splitDateToBuckets(date: Date): Bucket[] {
    const dateUpToMinutes = MetricBucketingService.getMinuteBucket(date);
    const dateUpToHours = MetricBucketingService.getHourBucket(date);
    const dateUpToDays = MetricBucketingService.getDayBucket(date);

    return [
      {
        dateGranular: dateUpToMinutes,
        granularity: MetricGranularity.Minute,
      },
      {
        dateGranular: dateUpToHours,
        granularity: MetricGranularity.Hour,
      },
      {
        dateGranular: dateUpToDays,
        granularity: MetricGranularity.Day,
      },
      {
        dateGranular: MetricGranularity.AllTime,
        granularity: MetricGranularity.AllTime,
      },
    ];
  }

  public static getMinuteBucket(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  public static getHourBucket(date: Date): string {
    return date.toISOString().slice(0, 13);
  }

  public static getDayBucket(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  public static getBucket(date: Date, granularity: MetricGranularity): string {
    switch (granularity) {
      case MetricGranularity.Minute:
        return MetricBucketingService.getMinuteBucket(date);
      case MetricGranularity.Hour:
        return MetricBucketingService.getHourBucket(date);
      case MetricGranularity.Day:
        return MetricBucketingService.getDayBucket(date);
      default:
        throw new Error('Unknown granularity');
    }
  }
}
