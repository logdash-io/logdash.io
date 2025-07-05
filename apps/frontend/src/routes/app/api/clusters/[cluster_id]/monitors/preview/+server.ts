import type { HttpPingCreatedEvent } from '$lib/domains/app/projects/domain/monitoring/http-ping.js';
import { minToMs } from '$lib/domains/shared/utils/time';
import { type RequestHandler } from '@sveltejs/kit';
import { produce } from 'sveltekit-sse';

const PING_INTERVAL = 20_000;
const PING_COUNT = 10;
const UNLOCK_TIMEOUT = PING_COUNT * PING_INTERVAL + minToMs(1);

const createPingScheduler = (
  url: string,
  emit: (event: string, payload: HttpPingCreatedEvent) => void,
) => {
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  const ping = async (id: string) => {
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      emit('ping-status', {
        id,
        statusCode: response.status,
        clusterId: 'preview',
        createdAt: new Date(),
        message: `Ping ${id} to ${url} successful`,
        httpMonitorId: 'preview',
        responseTimeMs: Date.now() - start,
      });
    } catch (error) {
      emit('ping-status', {
        id,
        statusCode: 0,
        clusterId: 'preview',
        createdAt: new Date(),
        message: `Ping ${id} to ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
        httpMonitorId: 'preview',
        responseTimeMs: Date.now() - start,
      });
    }
  };

  for (let i = 0; i < PING_COUNT; i++) {
    timeouts.push(setTimeout(() => ping(`${i + 1}`), i * PING_INTERVAL));
  }

  return () => timeouts.forEach(clearTimeout);
};

export const POST: RequestHandler = async ({ params, cookies, request }) => {
  return produce(
    async function start({ emit, lock }) {
      const body = await request.json().catch(() => ({}));
      const pingUrl = body.url;

      console.log('pingUrl:', pingUrl);

      const cleanupPings = pingUrl
        ? createPingScheduler(pingUrl, (e, d) => emit(e, JSON.stringify(d)))
        : () => {};
      const unlockTimer = setTimeout(() => lock.set(false), UNLOCK_TIMEOUT);

      return () => {
        clearTimeout(unlockTimer);
        cleanupPings();
      };
    },
    {
      ping: 30000,
      stop() {
        console.log('[Monitor] Client disconnected.');
      },
    },
  );
};
