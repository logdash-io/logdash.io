import { MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import request from 'supertest';
import { LogCoreController } from '../../src/log/core/log-core.controller';
import { CreateLogBody } from '../../src/log/core/dto/create-log.body';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';
import { LogEvents } from '../../src/log/events/log-events.enum';
import { createTestApp } from '../utils/bootstrap';

describe('LogCoreController (SSE)', () => {
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

  describe('GET /projects/:projectId/logs/sse', () => {
    it('delivers a log to the streams of its project without a listener per stream', async () => {
      // given
      const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
      const setupB = await bootstrap.utils.generalUtils.setupAnonymous();
      const controller = bootstrap.app.get(LogCoreController);
      const eventEmitter = bootstrap.app.get(EventEmitter2);
      const listenersBefore = eventEmitter.listenerCount(LogEvents.LogCreatedEvent);

      const projectIds = [setupA.project.id, setupA.project.id, setupB.project.id];
      const received: MessageEvent[][] = projectIds.map(() => []);
      const streams = await Promise.all(
        projectIds.map((projectId) => controller.streamProjectLogs({}, projectId)),
      );
      const subscriptions = streams.map((stream, index) =>
        stream.subscribe((message) => received[index].push(message)),
      );

      const body: CreateLogBody = {
        createdAt: new Date().toISOString(),
        message: 'hello',
        level: LogLevel.Info,
      };

      // when
      await request(bootstrap.app.getHttpServer())
        .post('/logs')
        .set('project-api-key', setupA.apiKey.value)
        .send(body);

      // then
      expect(eventEmitter.listenerCount(LogEvents.LogCreatedEvent)).toBe(listenersBefore);
      expect(received[0]).toHaveLength(1);
      expect(received[0][0].data).toMatchObject({ projectId: setupA.project.id, message: 'hello' });
      expect(received[1]).toHaveLength(1);
      expect(received[2]).toHaveLength(0);

      subscriptions.forEach((subscription) => subscription.unsubscribe());
    });
  });
});
