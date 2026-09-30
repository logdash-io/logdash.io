import { MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricCoreController } from '../../src/metric/core/metric-core.controller';
import { MetricOperation } from '../../src/metric/core/enums/metric-operation.enum';
import { MetricCreatedEvent } from '../../src/metric/events/definitions/metric-created.event';
import { MetricEvents } from '../../src/metric/events/metric-events.enum';
import { MetricGranularity } from '../../src/metric-shared/enums/metric-granularity.enum';
import { createTestApp } from '../utils/bootstrap';

describe('MetricCoreController (SSE)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('GET /projects/:projectId/metrics/sse', () => {
    it('delivers metrics to the streams of their project without a listener per stream', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const controller = bootstrap.app.get(MetricCoreController);
      const eventEmitter = bootstrap.app.get(EventEmitter2);
      const listenersBefore = eventEmitter.listenerCount(MetricEvents.MetricCreatedEvent);

      const projectIds = [setupA.project.id, setupA.project.id, setupB.project.id];
      const received: MessageEvent[][] = projectIds.map(() => []);
      const subscriptions = projectIds.map((projectId, index) =>
        controller
          .streamProjectMetrics(projectId)
          .subscribe((message) => received[index].push(message)),
      );

      // when
      await bootstrap.utils.metricUtils.recordMetric({
        apiKey: setupA.apiKey.value,
        name: 'users',
        value: 1,
        operation: MetricOperation.Set,
      });

      // then
      expect(eventEmitter.listenerCount(MetricEvents.MetricCreatedEvent)).toBe(listenersBefore);
      expect(received[0].length).toBeGreaterThan(0);
      expect(received[1]).toHaveLength(received[0].length);
      expect(received[2]).toHaveLength(0);
      received[0].forEach((message) => {
        const event = message.data as MetricCreatedEvent;
        expect(event.projectId).toBe(setupA.project.id);
        expect(event.granularity).not.toBe(MetricGranularity.AllTime);
      });

      subscriptions.forEach((subscription) => subscription.unsubscribe());
    });
  });
});
