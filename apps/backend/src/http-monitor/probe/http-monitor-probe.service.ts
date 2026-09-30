import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { safeHttpRequest } from '../../shared/ssrf/safe-http-request';
import { ProbeHttpMonitorUrlResponse } from '../core/dto/probe-http-monitor-url.response';

const REQUEST_TIMEOUT_MS = 5_000;
export const PROBE_DEADLINE_MS = 8_000;
export const MAX_HEALTH_BODY_BYTES = 16 * 1024;
const HEALTH_PATHS = ['/health', '/api/health', '/up'];

@Injectable()
export class HttpMonitorProbeService {
  public async probe(rawUrl: string): Promise<ProbeHttpMonitorUrlResponse> {
    const url = new URL(rawUrl);
    const ownPath = url.pathname.replace(/\/+$/, '');
    const candidates = HEALTH_PATHS.filter((path) => path !== ownPath);

    const [target, madeUp, ...candidateBodies] = await this.readBodiesBeforeDeadline([
      rawUrl,
      new URL(`/logdash-probe-${randomUUID()}`, url.origin).toString(),
      ...candidates.map((path) => new URL(path, url.origin).toString()),
    ]);

    return {
      catchAll: madeUp !== null && madeUp === target,
      healthPaths: candidates.filter((_, index) =>
        this.isHealthBody(candidateBodies[index], madeUp),
      ),
    };
  }

  private isHealthBody(body: string | null, madeUpBody: string | null): boolean {
    return body !== null && body !== madeUpBody && Buffer.byteLength(body) <= MAX_HEALTH_BODY_BYTES;
  }

  private async readBodiesBeforeDeadline(urls: string[]): Promise<(string | null)[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_DEADLINE_MS);
    const deadline = new Promise<null>((resolve) => {
      controller.signal.addEventListener('abort', () => resolve(null));
    });

    try {
      return await Promise.all(
        urls.map((url) => Promise.race([this.readBody(url, controller.signal), deadline])),
      );
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }

  private async readBody(url: string, signal: AbortSignal): Promise<string | null> {
    try {
      const response = await safeHttpRequest({
        url,
        method: 'GET',
        timeout: REQUEST_TIMEOUT_MS,
        responseType: 'text',
        signal,
      });

      return response.data as string;
    } catch {
      return null;
    }
  }
}
