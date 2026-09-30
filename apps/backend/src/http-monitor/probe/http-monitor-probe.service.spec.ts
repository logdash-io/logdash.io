import { AxiosResponse } from 'axios';
import { safeHttpRequest } from '../../shared/ssrf/safe-http-request';
import { HttpMonitorProbeService, PROBE_DEADLINE_MS } from './http-monitor-probe.service';

jest.mock('../../shared/ssrf/safe-http-request');

const safeHttpRequestMock = safeHttpRequest as jest.MockedFunction<typeof safeHttpRequest>;

describe('HttpMonitorProbeService', () => {
  afterEach(() => {
    jest.useRealTimers();
    safeHttpRequestMock.mockReset();
  });

  it('answers at the deadline, counts pending requests as failures and aborts them', async () => {
    // given
    jest.useFakeTimers();
    const pendingSignals: AbortSignal[] = [];
    safeHttpRequestMock.mockImplementation(({ url, signal }) => {
      const { pathname } = new URL(url);

      if (pathname === '/health') {
        pendingSignals.push(signal as AbortSignal);
        return new Promise<AxiosResponse>(() => {});
      }

      if (pathname === '/' || pathname === '/up') {
        return Promise.resolve({ data: pathname } as AxiosResponse);
      }

      return Promise.reject(new Error('Request failed with status code 404'));
    });

    // when
    const result = new HttpMonitorProbeService().probe('https://example.com/');
    await jest.advanceTimersByTimeAsync(PROBE_DEADLINE_MS);

    // then
    await expect(result).resolves.toEqual({ catchAll: false, healthPaths: ['/up'] });
    expect(pendingSignals.map((signal) => signal.aborted)).toEqual([true]);
  });
});
