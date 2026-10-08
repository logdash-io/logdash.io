import nock from 'nock';
import { TelegramOptions } from '../../src/notification-channel/core/types/telegram-options.type';
import { createTestApp } from '../utils/bootstrap';
import { waitFor } from '../utils/wait-for';
import { TelegramSendMessageBody } from '../utils/telegram-utils';
import { HttpPingPingerService } from '../../src/http-ping/pinger/http-ping-pinger.service';
import { ClusterTier } from '../../src/cluster/core/enums/cluster-tier.enum';

describe('Http monitor full process', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    // nock interceptors are global and survive across spec files when jest runs
    // in band, so make sure this suite does not leak its mocks into the next one.
    nock.cleanAll();
    await bootstrap.methods.afterAll();
  });

  const setupMonitorWithTelegram = async (): Promise<{
    service: HttpPingPingerService;
    telegramPostedDtos: TelegramSendMessageBody[];
  }> => {
    const { token, project, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();

    const channel =
      await bootstrap.utils.notificationChannelUtils.createTelegramNotificationChannel({
        clusterId: cluster.id,
        token,
        options: {
          botToken: '123456:some-valid-token',
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

    const telegramPostedDtos: TelegramSendMessageBody[] = [];
    bootstrap.utils.telegramUtils.setUpTelegramSendMessageListener({
      botId: (channel.options as TelegramOptions).botToken!,
      onMessage: (dto) => {
        telegramPostedDtos.push(dto);
      },
    });

    return { service: bootstrap.app.get(HttpPingPingerService), telegramPostedDtos };
  };

  const ping = async (service: HttpPingPingerService, status: number): Promise<void> => {
    nock('https://chess.com')
      .get('/')
      .reply(status, status === 200 ? 'ok' : { error: 'some funny error' });
    await service.tryPingMonitors([ClusterTier.Free]);
  };

  const codeBlock = '```';
  const upMessage = `🟢  *some name* is up`;
  const downMessage = `🔴  *some name* is down
${codeBlock}
Status code: 500
Error: \\{"error":"some funny error"\\}
${codeBlock}`;

  it('sends status change messages once a failure is confirmed by the next ping', async () => {
    // given
    const { service, telegramPostedDtos } = await setupMonitorWithTelegram();

    // when
    await ping(service, 200);
    await ping(service, 500);
    await ping(service, 500);
    await ping(service, 500);
    await ping(service, 200);

    await waitFor(
      () => Promise.resolve(telegramPostedDtos.length),
      (count) => count >= 3,
    );

    // then
    expect(telegramPostedDtos.map((dto) => dto.text)).toEqual([upMessage, downMessage, upMessage]);
  });

  it('does not alert on a single failed ping', async () => {
    // given
    const { service, telegramPostedDtos } = await setupMonitorWithTelegram();

    // when
    await ping(service, 200);
    await ping(service, 500);
    await ping(service, 200);
    await ping(service, 500);
    await ping(service, 500);

    await waitFor(
      () => Promise.resolve(telegramPostedDtos.length),
      (count) => count >= 2,
    );

    // then
    expect(telegramPostedDtos.map((dto) => dto.text)).toEqual([upMessage, downMessage]);
  });
});
