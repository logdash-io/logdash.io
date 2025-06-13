import { VirtualBucket } from './virtual-bucket.type';

describe('VirtualBucket', () => {
  describe('fromMany', () => {
    it('throws for empty array', () => {
      const buckets: VirtualBucket[] = [];

      expect(() => VirtualBucket.fromMany(buckets)).toThrow('Cannot aggregate empty buckets');
    });

    it('averages for single bucket', () => {
      const buckets: VirtualBucket[] = [
        {
          timestamp: new Date('2023-01-01T10:00:00Z'),
          successCount: 10,
          failureCount: 5,
          averageLatencyMs: 125,
        },
      ];

      const result = VirtualBucket.fromMany(buckets);

      expect(result.timestamp).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(result.successCount).toBe(10);
      expect(result.failureCount).toBe(5);
      expect(result.averageLatencyMs).toBe(125);
    });

    it('averages for multiple buckets', () => {
      const buckets: VirtualBucket[] = [
        {
          timestamp: new Date('2023-01-01T10:00:00Z'),
          successCount: 1,
          failureCount: 1,
          averageLatencyMs: 150,
        },
        {
          timestamp: new Date('2023-01-01T10:01:00Z'),
          successCount: 1,
          failureCount: 2,
          averageLatencyMs: 300,
        },
      ];

      const result = VirtualBucket.fromMany(buckets);

      expect(result.timestamp).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(3);
      expect(result.averageLatencyMs).toBe(240);
    });
  });
});
