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
          0, // UTC+0
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
          0, // UTC+0
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
          0, // UTC+0
        );

        expect(result.alignedStartDate).toEqual(new Date('2024-01-01T17:15:00.000Z'));
        expect(result.alignedEndDate).toEqual(new Date('2024-01-01T17:30:00.000Z'));
      });
    });

    describe('timezone alignment', () => {
      describe('UTC+2 (Central European Time) - 4-hour buckets', () => {
        it('aligns 10:30 UTC (12:30 CET) to 8:00 CET boundary (6:00 UTC)', () => {
          const startDate = new Date('2024-01-01T10:30:00Z'); // 12:30 CET
          const endDate = new Date('2024-01-01T14:45:00Z'); // 16:45 CET

          const result = service.alignDatesToBucketBoundaries(
            startDate,
            endDate,
            LogAnalyticsBucket.FourHours,
            2, // UTC+2
          );

          // CET boundaries: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
          // 12:30 CET → aligns down to 12:00 CET (10:00 UTC)
          // 16:45 CET → aligns up to 20:00 CET (18:00 UTC)
          expect(result.alignedStartDate).toEqual(new Date('2024-01-01T10:00:00.000Z')); // 12:00 CET
          expect(result.alignedEndDate).toEqual(new Date('2024-01-01T18:00:00.000Z')); // 20:00 CET
        });
      });

      describe('UTC+9 (Japan Standard Time) - 4-hour buckets', () => {
        it('aligns 02:15 UTC (11:15 JST) to 08:00 JST boundary (23:00 UTC prev day)', () => {
          const startDate = new Date('2024-01-01T02:15:00Z'); // 11:15 JST
          const endDate = new Date('2024-01-01T07:30:00Z'); // 16:30 JST

          const result = service.alignDatesToBucketBoundaries(
            startDate,
            endDate,
            LogAnalyticsBucket.FourHours,
            9, // UTC+9
          );

          // JST boundaries: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
          // 11:15 JST → aligns down to 08:00 JST (23:00 UTC prev day)
          // 16:30 JST → aligns up to 20:00 JST (11:00 UTC)
          expect(result.alignedStartDate).toEqual(new Date('2023-12-31T23:00:00.000Z')); // 08:00 JST
          expect(result.alignedEndDate).toEqual(new Date('2024-01-01T11:00:00.000Z')); // 20:00 JST
        });
      });

      describe('UTC+5.5 (India Standard Time) - 4-hour buckets', () => {
        it('aligns 10:30 UTC (16:00 IST) to 16:00 IST boundary (10:30 UTC)', () => {
          const startDate = new Date('2024-01-01T10:30:00Z'); // 16:00 IST
          const endDate = new Date('2024-01-01T14:45:00Z'); // 20:15 IST

          const result = service.alignDatesToBucketBoundaries(
            startDate,
            endDate,
            LogAnalyticsBucket.FourHours,
            5.5, // UTC+5:30
          );

          // IST boundaries: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
          // 16:00 IST → aligns down to 16:00 IST (10:30 UTC)
          // 20:15 IST → aligns up to 00:00 IST (18:30 UTC)
          expect(result.alignedStartDate).toEqual(new Date('2024-01-01T10:30:00.000Z')); // 16:00 IST
          expect(result.alignedEndDate).toEqual(new Date('2024-01-01T18:30:00.000Z')); // 00:00 IST next day
        });
      });
    });

    describe('edge cases', () => {
      it('handles same start and end date', () => {
        const date = new Date('2024-01-01T17:03:00Z');

        const result = service.alignDatesToBucketBoundaries(
          date,
          date,
          LogAnalyticsBucket.FiveMinutes,
          0, // UTC+0
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
          0, // UTC+0
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
          0, // UTC+0
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
          0, // UTC+0
        );

        expect(result.alignedStartDate.getUTCSeconds()).toBe(0);
        expect(result.alignedStartDate.getUTCMilliseconds()).toBe(0);
        expect(result.alignedEndDate.getUTCSeconds()).toBe(0);
        expect(result.alignedEndDate.getUTCMilliseconds()).toBe(0);
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
            0, // UTC+0
          );

          expect(result.alignedStartDate).toEqual(new Date(expectedStart));
          expect(result.alignedEndDate).toEqual(new Date(expectedEnd));
        });
      });
    });
  });
});
