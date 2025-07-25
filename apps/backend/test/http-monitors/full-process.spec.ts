import * as nock from 'nock';
import { TelegramOptions } from '../../src/notification-channel/core/types/telegram-options.type';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { createTestApp } from '../utils/bootstrap';
import { sleep } from '../utils/sleep';
import { HttpPingPingerService } from '../../src/http-ping/pinger/http-ping-pinger.service';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';

describe('Http monitor full process', () => {
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

    await bootstrap.utils.httpMonitorsUtils.createClaimedHttpMonitor({
      projectId: project.id,
      token,
      notificationChannelsIds: [channel.id],
      name: 'some name',
      url: 'https://chess.com',
    });

    let telegramPostedDtos: any[] = [];
    await bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
      botId: (channel.options as TelegramOptions).botToken!,
      onMessage: (dto) => {
        telegramPostedDtos.push(dto);
      },
    });

    // when
    const service = bootstrap.app.get(HttpPingPingerService);

    // at first the status is unknown
    // unknown -> up
    nock('https://chess.com').get('/').reply(200, 'ok');
    await service.tryPingMonitors([ProjectTier.Free]);

    // up -> down
    nock('https://chess.com').get('/').reply(500, { error: 'some funny error' });
    await service.tryPingMonitors([ProjectTier.Free]);

    // down -> up
    nock('https://chess.com').get('/').reply(200, 'ok');
    await service.tryPingMonitors([ProjectTier.Free]);

    await sleep(1000);

    // then
    const codeBlock = '```';

    expect(telegramPostedDtos[0].text).toBe(`🟢  *some name* is up`);
    expect(telegramPostedDtos[1].text).toBe(`🔴  *some name* is down
${codeBlock}
Status code: 500
Error: \\{"error":"some funny error"\\}
${codeBlock}`);
    expect(telegramPostedDtos[2].text).toBe(`🟢  *some name* is up`);
  });
});
