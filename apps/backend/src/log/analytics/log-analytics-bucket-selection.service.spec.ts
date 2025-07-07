import { LogAnalyticsBucketSelectionService } from './log-analytics-bucket-selection.service';
import { LogAnalyticsBucket } from './dto/log-analytics-query.dto';

describe('LogAnalyticsBucketSelectionService', () => {
  let service: LogAnalyticsBucketSelectionService;

  beforeEach(() => {
    service = new LogAnalyticsBucketSelectionService();
  });

  describe('selectOptimalBucketSize', () => {
    describe('short time ranges', () => {
      it('selects 1-minute buckets for 30 minute range (30 buckets)', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-01T10:30:00Z'); // 30 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.OneMinute);
      });

      it('selects 5-minute buckets for 2.5 hour range (30 buckets)', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-01T12:30:00Z'); // 150 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.FiveMinutes);
      });

      it('selects 10-minute buckets for 5 hour range', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-01T15:00:00Z'); // 300 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.TenMinutes);
      });

      it('selects 15-minute buckets for 7.5 hour range', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-01T17:30:00Z'); // 450 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.FifteenMinutes);
      });
    });

    describe('medium time ranges', () => {
      it('selects 30-minute buckets for 15 hour range', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-02T01:00:00Z'); // 15 hours = 900 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.ThirtyMinutes);
      });

      it('selects 1-hour buckets for 30 hour range', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-02T16:00:00Z'); // 30 hours = 1800 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.OneHour);
      });

      it('selects 2-hour buckets for 60 hour range', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-03T22:00:00Z'); // 60 hours = 3600 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.TwoHours);
      });
    });

    describe('long time ranges', () => {
      it('selects 4-hour buckets for 5 day range', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-06T10:00:00Z'); // 5 days = 7200 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.FourHours);
      });

      it('selects 8-hour buckets for 10 day range', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-11T10:00:00Z'); // 10 days = 14400 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.EightHours);
      });

      it('selects 24-hour buckets for very long ranges (fallback to largest)', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-02-01T10:00:00Z'); // 31 days = ~44640 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.TwentyFourHours);
      });
    });

    describe('edge cases', () => {
      it('handles very short ranges (1 minute)', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-01T10:01:00Z'); // 1 minute

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.OneMinute);
      });

      it('handles exact bucket boundaries', () => {
        const startDate = new Date('2024-01-01T10:00:00Z');
        const endDate = new Date('2024-01-01T15:00:00Z'); // 300 minutes = exactly 30 buckets of 10 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.TenMinutes);
      });

      it('handles milliseconds correctly', () => {
        const startDate = new Date('2024-01-01T10:00:00.123Z');
        const endDate = new Date('2024-01-01T10:05:00.456Z'); // ~5 minutes

        const result = service.selectOptimalBucketSize(startDate, endDate);

        expect(result).toBe(LogAnalyticsBucket.OneMinute);
      });
    });
  });

  describe('ensures bucket count stays under limit', () => {
    describe('never returns more than 30 buckets for any reasonable range', () => {
      const testCases = [
        {
          name: '12 hours',
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-01T12:00:00Z'),
        },
        {
          name: '24 hours',
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-02T00:00:00Z'),
        },
        {
          name: '48 hours',
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-03T00:00:00Z'),
        },
        {
          name: '1 week',
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-08T00:00:00Z'),
        },
        {
          name: '2 weeks',
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-15T00:00:00Z'),
        },
        {
          name: '1 month',
          start: new Date('2024-01-02T00:00:00Z'),
          end: new Date('2024-02-01T00:00:00Z'),
        },
      ];

      it.each(testCases)('$name range stays under limit', ({ start, end }) => {
        const selectedBucket = service.selectOptimalBucketSize(start, end);
        const bucketCount = service.calculateExpectedBucketCount(start, end, selectedBucket);

        expect(bucketCount).toBeLessThanOrEqual(30);
      });
    });
  });
});
