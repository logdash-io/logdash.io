import { MonitorStatus } from './enums/monitor-status.enum';
import { getMonitorStatus } from './get-monitor-status';

const pings = (...statusCodes: number[]): { statusCode: number }[] =>
  statusCodes.map((statusCode) => ({ statusCode }));

describe('getMonitorStatus', () => {
  it('is unknown without pings', () => {
    expect(getMonitorStatus([])).toBe(MonitorStatus.Unknown);
  });

  it('is up when every recent ping is 2xx or 3xx', () => {
    expect(getMonitorStatus(pings(200, 301, 204))).toBe(MonitorStatus.Up);
  });

  it('is down when the latest ping failed', () => {
    expect(getMonitorStatus(pings(503, 200, 200))).toBe(MonitorStatus.Down);
  });

  it('is down when the latest ping got no response', () => {
    expect(getMonitorStatus(pings(0, 200))).toBe(MonitorStatus.Down);
  });

  it('is degraded when an older recent ping failed', () => {
    expect(getMonitorStatus(pings(200, 200, 500))).toBe(MonitorStatus.Degraded);
  });

  it('ignores failures older than the 10 most recent pings', () => {
    expect(getMonitorStatus(pings(...Array<number>(10).fill(200), 500))).toBe(MonitorStatus.Up);
  });
});
