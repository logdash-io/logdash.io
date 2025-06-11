import { createTestApp } from '../utils/bootstrap';
import { HttpPingSchedulerService } from '../../src/http-ping/schedule/http-ping-scheduler.service';
import { TelegramOptions } from '../../src/notification-channel/core/types/telegram-options.type';
import { sleep } from '../utils/sleep';
import * as nock from 'nock';

describe('Http monitor full process', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  it('creates a monitor, pings it and sends status change message', async () => {
    // given
    const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

    const channel =
      await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
        clusterId: cluster.id,
        token,
        options: {
          botToken: 'some-valid-token',
          chatId: 'some-valid-chat-id',
        },
      });

    await bootstrap.utils.httpMonitorsUtils.createHttpMonitor({
      projectId: project.id,
      token,
      notificationChannelsIds: [channel.id],
      name: 'some name',
      url: 'https://chess.com',
    });

    let telegramPostedDtos: any[] = [];
    await bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
      botId: (channel.options as TelegramOptions).botToken,
      onMessage: (dto) => {
        telegramPostedDtos.push(dto);
      },
    });

    // when
    const service = bootstrap.app.get(HttpPingSchedulerService);

    // at first the status is unknown
    // unknown -> up
    nock('https://chess.com').get('/').reply(200, 'ok');
    await service.tryPingAllMonitors();

    // up -> down
    nock('https://chess.com').get('/').reply(500, 'error');
    await service.tryPingAllMonitors();

    // down -> up
    nock('https://chess.com').get('/').reply(200, 'ok');
    await service.tryPingAllMonitors();

    await sleep(1000);

    // then
    expect(telegramPostedDtos[0].text).toBe('✅ \"some name\" is back online!');
    expect(telegramPostedDtos[1].text).toBe('❌ \"some name\" is down!');
    expect(telegramPostedDtos[2].text).toBe('✅ \"some name\" is back online!');
  });
});
