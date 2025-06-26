import { Injectable } from '@nestjs/common';
import { LogAnalyticsBucket } from './dto/log-analytics-query.dto';

@Injectable()
export class LogAnalyticsDateAlignmentService {
  public alignDatesToBucketBoundaries(
    startDate: Date,
    endDate: Date,
    bucketMinutes: LogAnalyticsBucket,
    utcOffsetHours: number = 0,
  ): { alignedStartDate: Date; alignedEndDate: Date } {
    const alignedStartDate = this.alignStartDateToPreviousBoundary(
      startDate,
      bucketMinutes,
      utcOffsetHours,
    );
    const alignedEndDate = this.alignEndDateToNextBoundary(endDate, bucketMinutes, utcOffsetHours);

    return {
      alignedStartDate,
      alignedEndDate,
    };
  }

  private alignStartDateToPreviousBoundary(
    date: Date,
    bucketMinutes: number,
    utcOffsetHours: number,
  ): Date {
    // Convert to local time by adding the offset
    const localTime = new Date(date.getTime() + utcOffsetHours * 60 * 60 * 1000);

    if (bucketMinutes >= 60) {
      const totalMinutesFromLocalMidnight =
        localTime.getUTCHours() * 60 + localTime.getUTCMinutes();
      const alignedMinutesFromLocalMidnight =
        Math.floor(totalMinutesFromLocalMidnight / bucketMinutes) * bucketMinutes;

      localTime.setUTCHours(Math.floor(alignedMinutesFromLocalMidnight / 60));
      localTime.setUTCMinutes(alignedMinutesFromLocalMidnight % 60);
    } else {
      localTime.setUTCMinutes(
        Math.floor(localTime.getUTCMinutes() / bucketMinutes) * bucketMinutes,
      );
    }

    localTime.setUTCSeconds(0);
    localTime.setUTCMilliseconds(0);

    // Convert back to UTC by subtracting the offset
    return new Date(localTime.getTime() - utcOffsetHours * 60 * 60 * 1000);
  }

  private alignEndDateToNextBoundary(
    date: Date,
    bucketMinutes: number,
    utcOffsetHours: number,
  ): Date {
    // Convert to local time by adding the offset
    const localTime = new Date(date.getTime() + utcOffsetHours * 60 * 60 * 1000);

    const needsAlignment =
      localTime.getUTCSeconds() !== 0 ||
      localTime.getUTCMilliseconds() !== 0 ||
      (bucketMinutes >= 60
        ? (localTime.getUTCHours() * 60 + localTime.getUTCMinutes()) % bucketMinutes !== 0
        : localTime.getUTCMinutes() % bucketMinutes !== 0);

    if (needsAlignment) {
      if (bucketMinutes >= 60) {
        const totalMinutesFromLocalMidnight =
          localTime.getUTCHours() * 60 + localTime.getUTCMinutes();
        const alignedMinutesFromLocalMidnight =
          Math.ceil(totalMinutesFromLocalMidnight / bucketMinutes) * bucketMinutes;

        if (alignedMinutesFromLocalMidnight >= 24 * 60) {
          localTime.setUTCDate(localTime.getUTCDate() + 1);
          localTime.setUTCHours(0);
          localTime.setUTCMinutes(0);
        } else {
          localTime.setUTCHours(Math.floor(alignedMinutesFromLocalMidnight / 60));
          localTime.setUTCMinutes(alignedMinutesFromLocalMidnight % 60);
        }
      } else {
        localTime.setUTCMinutes(
          Math.ceil(localTime.getUTCMinutes() / bucketMinutes) * bucketMinutes,
        );
      }
    }

    localTime.setUTCSeconds(0);
    localTime.setUTCMilliseconds(0);

    // Convert back to UTC by subtracting the offset
    return new Date(localTime.getTime() - utcOffsetHours * 60 * 60 * 1000);
  }
}
