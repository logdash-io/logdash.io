import { BucketGrouping } from '../../read/http-ping-bucket-read.service';
import { HttpPingBucketNormalized } from './http-ping-bucket.interface';

describe('HttpPingBucketNormalized.fromExisting', () => {
  const createMockBucket = (
    id: string,
    timestamp: Date,
    httpMonitorId = 'test-monitor-id',
  ): HttpPingBucketNormalized => ({
    id,
    httpMonitorId,
    timestamp,
    successCount: 10,
    failureCount: 2,
    averageLatencyMs: 150.5,
  });

  describe('hourly grouping', () => {
    it('generates complete hourly buckets with no existing data', () => {
      const fromDate = new Date('2024-01-01T10:00:00Z');
      const existingBuckets: HttpPingBucketNormalized[] = [];
      const expectedCount = 3;

      const result = HttpPingBucketNormalized.fromExisting(
        existingBuckets,
        fromDate,
        BucketGrouping.Hour,
        expectedCount,
      );

      expect(result).toHaveLength(expectedCount);
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(result[2]).toBeNull();
    });

    it('generates complete hourly buckets with all existing data', () => {
      const fromDate = new Date('2024-01-01T10:00:00Z');
      const existingBuckets = [
        createMockBucket('1', new Date('2024-01-01T10:00:00Z')),
        createMockBucket('2', new Date('2024-01-01T11:00:00Z')),
        createMockBucket('3', new Date('2024-01-01T12:00:00Z')),
      ];
      const expectedCount = 3;

      const result = HttpPingBucketNormalized.fromExisting(
        existingBuckets,
        fromDate,
        BucketGrouping.Hour,
        expectedCount,
      );

      expect(result).toHaveLength(expectedCount);
      expect(result[0]).toEqual(existingBuckets[2]);
      expect(result[1]).toEqual(existingBuckets[1]);
      expect(result[2]).toEqual(existingBuckets[0]);
    });

    it('generates complete hourly buckets with mixed existing data', () => {
      const fromDate = new Date('2024-01-01T10:00:00Z');
      const existingBuckets = [
        createMockBucket('1', new Date('2024-01-01T10:00:00Z')),
        createMockBucket('3', new Date('2024-01-01T12:00:00Z')),
      ];
      const expectedCount = 4;

      const result = HttpPingBucketNormalized.fromExisting(
        existingBuckets,
        fromDate,
        BucketGrouping.Hour,
        expectedCount,
      );

      expect(result).toHaveLength(expectedCount);
      expect(result[0]).toBeNull();
      expect(result[1]).toEqual(existingBuckets[1]);
      expect(result[2]).toBeNull();
      expect(result[3]).toEqual(existingBuckets[0]);
    });

    it('normalizes minutes and seconds to 0 for hourly buckets', () => {
      const fromDate = new Date('2024-01-01T10:25:30Z');
      const existingBuckets = [createMockBucket('1', new Date('2024-01-01T10:00:00Z'))];
      const expectedCount = 2;

      const result = HttpPingBucketNormalized.fromExisting(
        existingBuckets,
        fromDate,
        BucketGrouping.Hour,
        expectedCount,
      );

      expect(result).toHaveLength(expectedCount);
      expect(result[0]).toBeNull();
      expect(result[1]).toEqual(existingBuckets[0]);
    });
  });

  describe('daily grouping', () => {
    it('generates complete daily buckets with no existing data', () => {
      const fromDate = new Date('2024-01-01T00:00:00Z');
      const existingBuckets: HttpPingBucketNormalized[] = [];
      const expectedCount = 3;

      const result = HttpPingBucketNormalized.fromExisting(
        existingBuckets,
        fromDate,
        BucketGrouping.Day,
        expectedCount,
      );

      expect(result).toHaveLength(expectedCount);
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(result[2]).toBeNull();
    });

    it('generates complete daily buckets with all existing data', () => {
      const fromDate = new Date('2024-01-01T00:00:00Z');
      const existingBuckets = [
        createMockBucket('1', new Date('2024-01-01T00:00:00Z')),
        createMockBucket('2', new Date('2024-01-02T00:00:00Z')),
        createMockBucket('3', new Date('2024-01-03T00:00:00Z')),
      ];
      const expectedCount = 3;

      const result = HttpPingBucketNormalized.fromExisting(
        existingBuckets,
        fromDate,
        BucketGrouping.Day,
        expectedCount,
      );

      expect(result).toHaveLength(expectedCount);
      expect(result[0]).toEqual(existingBuckets[2]);
      expect(result[1]).toEqual(existingBuckets[1]);
      expect(result[2]).toEqual(existingBuckets[0]);
    });

    it('generates complete daily buckets with mixed existing data', () => {
      const fromDate = new Date('2024-01-01T00:00:00Z');
      const existingBuckets = [
        createMockBucket('1', new Date('2024-01-01T00:00:00Z')),
        createMockBucket('3', new Date('2024-01-03T00:00:00Z')),
      ];
      const expectedCount = 4;

      const result = HttpPingBucketNormalized.fromExisting(
        existingBuckets,
        fromDate,
        BucketGrouping.Day,
        expectedCount,
      );

      expect(result).toHaveLength(expectedCount);
      expect(result[0]).toBeNull();
      expect(result[1]).toEqual(existingBuckets[1]);
      expect(result[2]).toBeNull();
      expect(result[3]).toEqual(existingBuckets[0]);
    });

    it('normalizes hours, minutes and seconds to 0 for daily buckets', () => {
      const fromDate = new Date('2024-01-01T15:25:30Z');
      const existingBuckets = [createMockBucket('1', new Date('2024-01-01T00:00:00Z'))];
      const expectedCount = 2;

      const result = HttpPingBucketNormalized.fromExisting(
        existingBuckets,
        fromDate,
        BucketGrouping.Day,
        expectedCount,
      );

      expect(result).toHaveLength(expectedCount);
      expect(result[0]).toBeNull();
      expect(result[1]).toEqual(existingBuckets[0]);
    });
  });
});
