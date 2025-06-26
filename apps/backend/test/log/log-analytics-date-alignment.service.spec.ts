import { LogAnalyticsDateAlignmentService } from '../../src/log/analytics/log-analytics-date-alignment.service';
import { LogAnalyticsBucket } from '../../src/log/analytics/dto/log-analytics-query.dto';

describe('LogAnalyticsDateAlignmentService', () => {
  let service: LogAnalyticsDateAlignmentService;

  beforeEach(() => {
    service = new LogAnalyticsDateAlignmentService();
  });

  describe('alignDatesToBucketBoundaries', () => {
    describe('5-minute buckets', () => {
      it('aligns 17:02-17:08 to 17:00-17:10', () => {
        const startDate = new Date('2024-01-01T17:02:00Z');
        const endDate = new Date('2024-01-01T17:08:00Z');

        const result = service.alignDatesToBucketBoundaries(
          startDate,
          endDate,
          LogAnalyticsBucket.FiveMinutes,
        );

        expect(result.alignedStartDate).toEqual(new Date('2024-01-01T17:00:00.000Z'));
        expect(result.alignedEndDate).toEqual(new Date('2024-01-01T17:10:00.000Z'));
      });

      it('keeps already aligned dates unchanged', () => {
        const startDate = new Date('2024-01-01T17:00:00.000Z');
        const endDate = new Date('2024-01-01T17:10:00.000Z');

        const result = service.alignDatesToBucketBoundaries(
          startDate,
          endDate,
          LogAnalyticsBucket.FiveMinutes,
        );

        expect(result.alignedStartDate).toEqual(new Date('2024-01-01T17:00:00.000Z'));
        expect(result.alignedEndDate).toEqual(new Date('2024-01-01T17:10:00.000Z'));
      });
    });

    describe('15-minute buckets', () => {
      it('aligns 17:18-17:23 to 17:15-17:30', () => {
        const startDate = new Date('2024-01-01T17:18:00Z');
        const endDate = new Date('2024-01-01T17:23:00Z');

        const result = service.alignDatesToBucketBoundaries(
          startDate,
          endDate,
          LogAnalyticsBucket.FifteenMinutes,
        );

        expect(result.alignedStartDate).toEqual(new Date('2024-01-01T17:15:00.000Z'));
        expect(result.alignedEndDate).toEqual(new Date('2024-01-01T17:30:00.000Z'));
      });
    });

    describe('edge cases', () => {
      it('handles same start and end date', () => {
        const date = new Date('2024-01-01T17:03:00Z');

        const result = service.alignDatesToBucketBoundaries(
          date,
          date,
          LogAnalyticsBucket.FiveMinutes,
        );

        expect(result.alignedStartDate).toEqual(new Date('2024-01-01T17:00:00.000Z'));
        expect(result.alignedEndDate).toEqual(new Date('2024-01-01T17:05:00.000Z'));
      });

      it('handles midnight boundary', () => {
        const startDate = new Date('2024-01-01T23:58:00Z');
        const endDate = new Date('2024-01-02T00:03:00Z');

        const result = service.alignDatesToBucketBoundaries(
          startDate,
          endDate,
          LogAnalyticsBucket.FiveMinutes,
        );

        expect(result.alignedStartDate).toEqual(new Date('2024-01-01T23:55:00.000Z'));
        expect(result.alignedEndDate).toEqual(new Date('2024-01-02T00:05:00.000Z'));
      });

      it('handles month boundary', () => {
        const startDate = new Date('2024-01-31T23:58:00Z');
        const endDate = new Date('2024-02-01T00:03:00Z');

        const result = service.alignDatesToBucketBoundaries(
          startDate,
          endDate,
          LogAnalyticsBucket.TenMinutes,
        );

        expect(result.alignedStartDate).toEqual(new Date('2024-01-31T23:50:00.000Z'));
        expect(result.alignedEndDate).toEqual(new Date('2024-02-01T00:10:00.000Z'));
      });

      it('removes milliseconds and seconds from aligned dates', () => {
        const startDate = new Date('2024-01-01T17:03:45.123Z');
        const endDate = new Date('2024-01-01T17:08:30.999Z');

        const result = service.alignDatesToBucketBoundaries(
          startDate,
          endDate,
          LogAnalyticsBucket.FiveMinutes,
        );

        expect(result.alignedStartDate.getSeconds()).toBe(0);
        expect(result.alignedStartDate.getMilliseconds()).toBe(0);
        expect(result.alignedEndDate.getSeconds()).toBe(0);
        expect(result.alignedEndDate.getMilliseconds()).toBe(0);
      });
    });

    describe('all bucket sizes', () => {
      const testCases = [
        {
          bucket: LogAnalyticsBucket.FiveMinutes,
          startInput: '2024-01-01T10:03:00Z',
          endInput: '2024-01-01T10:07:00Z',
          expectedStart: '2024-01-01T10:00:00.000Z',
          expectedEnd: '2024-01-01T10:10:00.000Z',
        },
        {
          bucket: LogAnalyticsBucket.TenMinutes,
          startInput: '2024-01-01T10:03:00Z',
          endInput: '2024-01-01T10:17:00Z',
          expectedStart: '2024-01-01T10:00:00.000Z',
          expectedEnd: '2024-01-01T10:20:00.000Z',
        },
        {
          bucket: LogAnalyticsBucket.TwentyMinutes,
          startInput: '2024-01-01T10:15:00Z',
          endInput: '2024-01-01T10:35:00Z',
          expectedStart: '2024-01-01T10:00:00.000Z',
          expectedEnd: '2024-01-01T10:40:00.000Z',
        },
        {
          bucket: LogAnalyticsBucket.FourHours,
          startInput: '2024-01-01T10:15:00Z',
          endInput: '2024-01-01T15:35:00Z',
          expectedStart: '2024-01-01T08:00:00.000Z',
          expectedEnd: '2024-01-01T16:00:00.000Z',
        },
        {
          bucket: LogAnalyticsBucket.EightHours,
          startInput: '2024-01-01T10:15:00Z',
          endInput: '2024-01-01T19:35:00Z',
          expectedStart: '2024-01-01T08:00:00.000Z',
          expectedEnd: '2024-01-02T00:00:00.000Z',
        },
      ];

      testCases.forEach(({ bucket, startInput, endInput, expectedStart, expectedEnd }) => {
        it(`aligns correctly for ${bucket}-minute buckets`, () => {
          const result = service.alignDatesToBucketBoundaries(
            new Date(startInput),
            new Date(endInput),
            bucket,
          );

          expect(result.alignedStartDate).toEqual(new Date(expectedStart));
          expect(result.alignedEndDate).toEqual(new Date(expectedEnd));
        });
      });
    });
  });
});
