import { Injectable } from '@nestjs/common';
import { LogAnalyticsBucket } from './dto/log-analytics-query.dto';

@Injectable()
export class LogAnalyticsDateAlignmentService {
  public alignDatesToBucketBoundaries(
    startDate: Date,
    endDate: Date,
    bucketMinutes: LogAnalyticsBucket,
  ): { alignedStartDate: Date; alignedEndDate: Date } {
    const alignedStartDate = this.alignStartDateToPreviousBoundary(startDate, bucketMinutes);
    const alignedEndDate = this.alignEndDateToNextBoundary(endDate, bucketMinutes);

    return {
      alignedStartDate,
      alignedEndDate,
    };
  }

  private alignStartDateToPreviousBoundary(date: Date, bucketMinutes: number): Date {
    const aligned = new Date(date);

    if (bucketMinutes >= 60) {
      const totalMinutesFromMidnight = aligned.getUTCHours() * 60 + aligned.getUTCMinutes();
      const alignedMinutesFromMidnight =
        Math.floor(totalMinutesFromMidnight / bucketMinutes) * bucketMinutes;

      aligned.setUTCHours(Math.floor(alignedMinutesFromMidnight / 60));
      aligned.setUTCMinutes(alignedMinutesFromMidnight % 60);
    } else {
      aligned.setUTCMinutes(Math.floor(aligned.getUTCMinutes() / bucketMinutes) * bucketMinutes);
    }

    aligned.setUTCSeconds(0);
    aligned.setUTCMilliseconds(0);

    return aligned;
  }

  private alignEndDateToNextBoundary(date: Date, bucketMinutes: number): Date {
    const aligned = new Date(date);

    const needsAlignment =
      aligned.getUTCSeconds() !== 0 ||
      aligned.getUTCMilliseconds() !== 0 ||
      (bucketMinutes >= 60
        ? (aligned.getUTCHours() * 60 + aligned.getUTCMinutes()) % bucketMinutes !== 0
        : aligned.getUTCMinutes() % bucketMinutes !== 0);

    if (needsAlignment) {
      if (bucketMinutes >= 60) {
        const totalMinutesFromMidnight = aligned.getUTCHours() * 60 + aligned.getUTCMinutes();
        const alignedMinutesFromMidnight =
          Math.ceil(totalMinutesFromMidnight / bucketMinutes) * bucketMinutes;

        if (alignedMinutesFromMidnight >= 24 * 60) {
          aligned.setUTCDate(aligned.getUTCDate() + 1);
          aligned.setUTCHours(0);
          aligned.setUTCMinutes(0);
        } else {
          aligned.setUTCHours(Math.floor(alignedMinutesFromMidnight / 60));
          aligned.setUTCMinutes(alignedMinutesFromMidnight % 60);
        }
      } else {
        aligned.setUTCMinutes(Math.ceil(aligned.getUTCMinutes() / bucketMinutes) * bucketMinutes);
      }
    }

    aligned.setUTCSeconds(0);
    aligned.setUTCMilliseconds(0);

    return aligned;
  }
}
