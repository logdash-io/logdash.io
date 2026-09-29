import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { waitFor } from '../utils/wait-for';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';
import { CreatePersonalApiKeyResponse } from '../../src/personal-api-key/core/dto/create-personal-api-key.response';
import { CliAuthApproveResult, CliAuthStartResult } from '../../src/cli-auth/core/cli-auth.service';
import { ResendTemplatedEmailsService } from '../../src/email/resend/resend-templated-emails.service';
import { ResendService } from '../../src/email/resend/resend.service';
import { getEnvConfig } from '../../src/shared/configs/env-configs';

describe('Personal API key created email', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let sendSpy: jest.SpyInstance;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    jest.replaceProperty(getEnvConfig().resend, 'enabled', true);
    sendSpy = jest
      .spyOn(bootstrap.app.get(ResendTemplatedEmailsService), 'sendPersonalApiKeyCreatedEmail')
      .mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const waitForEmail = async (): Promise<void> => {
    await waitFor(
      () => Promise.resolve(sendSpy.mock.calls.length),
      (calls) => calls > 0,
    );
  };

  describe('POST /personal-api-keys', () => {
    it('emails the owner about the new key', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupClaimed();

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          label: 'My laptop',
          scopes: [{ resource: Resource.Logs, action: Action.Read }],
          access: { kind: 'all' },
        });
      await waitForEmail();

      // then
      expect(response.status).toBe(201);
      const created = response.body as CreatePersonalApiKeyResponse;
      const owner = await bootstrap.models.userModel.findById(user.id).lean();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(owner!.email, {
        userId: user.id,
        label: 'My laptop',
        prefix: created.prefix,
        scopes: [{ resource: Resource.Logs, action: Action.Read }],
        access: { kind: 'all' },
        expiresAt: undefined,
      });
    });
  });

  describe('handlePersonalApiKeyCreatedEvent', () => {
    it('does not email an anonymous user, who has no email', async () => {
      // given
      const { user } = await bootstrap.utils.generalUtils.setupAnonymous();

      // when
      await bootstrap.app.get(ResendService).handlePersonalApiKeyCreatedEvent({
        userId: user.id,
        label: 'k',
        prefix: 'ldp_abcdefgh',
        scopes: [],
        access: { kind: 'all' },
      });

      // then
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/cli/approve', () => {
    it('emails the owner about the key minted for the CLI', async () => {
      // given
      const { token, user } = await bootstrap.utils.generalUtils.setupClaimed();
      const startResponse = await request(bootstrap.app.getHttpServer())
        .post('/auth/cli/start')
        .send();
      const { userCode } = startResponse.body as CliAuthStartResult;

      // when
      const response = await request(bootstrap.app.getHttpServer())
        .post('/auth/cli/approve')
        .set('Authorization', `Bearer ${token}`)
        .send({ userCode, access: { kind: 'all' } });
      await waitForEmail();

      // then
      expect(response.status).toBe(200);
      const approved = response.body as CliAuthApproveResult;
      const owner = await bootstrap.models.userModel.findById(user.id).lean();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        owner!.email,
        expect.objectContaining({
          userId: user.id,
          label: `CLI (${userCode})`,
          prefix: approved.prefix,
          expiresAt: new Date(approved.expiresAt),
        }),
      );
    });
  });

  describe('sendPersonalApiKeyCreatedEmail', () => {
    it('renders the key details and escapes the label', async () => {
      // given
      jest.restoreAllMocks();
      const service = bootstrap.app.get(ResendTemplatedEmailsService);
      const resendSpy = jest
        .spyOn(service['resend'].emails, 'send')
        .mockResolvedValue({ data: { id: 'email-id' }, error: null, headers: null });

      // when
      await service.sendPersonalApiKeyCreatedEmail('owner@example.com', {
        userId: 'user-id',
        label: '<script>alert("x")</script>',
        prefix: 'ldp_abcdefgh',
        scopes: [
          { resource: Resource.Monitors, action: Action.Delete },
          { resource: Resource.Logs, action: Action.None },
        ],
        access: { kind: 'projects', ids: ['a', 'b'] },
      });

      // then
      expect(resendSpy).toHaveBeenCalledTimes(1);
      const [email] = resendSpy.mock.calls[0];
      expect(email.to).toBe('owner@example.com');
      expect(email.html).not.toContain('<script>');
      expect(email.html).toContain('&#60;script&#62;alert(&#34;x&#34;)&#60;/script&#62;');
      expect(email.html).toContain('ldp_abcdefgh');
      expect(email.html).toContain('monitors:delete<br/>');
      expect(email.html).toContain('2 projects');
      expect(email.html).toContain('No expiration');
      expect(email.html).toContain(`${getEnvConfig().app.url}/app/account/api-keys`);
    });
  });
});
