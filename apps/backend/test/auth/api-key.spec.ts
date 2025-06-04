import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { Types } from 'mongoose';

describe('Auth (API key)', () => {
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

  describe('POST /auth/api-key', () => {
    it('authenticates successfully with valid API key and returns JWT token', async () => {
      const { project, apiKey } = await bootstrap.utils.generalUtils.setupAnonymous();

      const response = await request(bootstrap.app.getHttpServer()).post('/auth/api-key').send({
        apiKey: apiKey.value,
      });

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it('returns 401 for invalid API key', async () => {
      const response = await request(bootstrap.app.getHttpServer()).post('/auth/api-key').send({
        apiKey: 'invalid-api-key',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid API key');
    });

    it('returns 401 when project is not found for valid API key', async () => {
      await bootstrap.models.apiKeyModel.create({
        _id: new Types.ObjectId(),
        value: 'orphaned-api-key',
        projectId: new Types.ObjectId().toString(),
      });

      const response = await request(bootstrap.app.getHttpServer()).post('/auth/api-key').send({
        apiKey: 'orphaned-api-key',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid API key');
    });
  });
});
