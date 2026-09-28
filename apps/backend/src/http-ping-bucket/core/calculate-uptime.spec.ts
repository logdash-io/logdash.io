import { calculateUptime } from './calculate-uptime';

describe('calculateUptime', () => {
  it('is null without buckets', () => {
    expect(calculateUptime([])).toBeNull();
  });

  it('is null when no bucket has checks', () => {
    expect(calculateUptime([null, { successCount: 0, failureCount: 0 }])).toBeNull();
  });

  it('weighs every check equally across buckets', () => {
    expect(
      calculateUptime([
        { successCount: 1, failureCount: 1 },
        null,
        { successCount: 2, failureCount: 0 },
      ]),
    ).toBe(75);
  });

  it('is 100 when every check succeeded', () => {
    expect(calculateUptime([{ successCount: 5, failureCount: 0 }])).toBe(100);
  });
});
