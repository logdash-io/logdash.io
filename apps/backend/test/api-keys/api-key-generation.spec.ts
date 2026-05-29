import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';

describe('Api keys (generation)', () => {
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

  describe('generated key value', () => {
    it('prefixes freshly created keys with ldi_ and produces distinct values', async () => {
      const first = await bootstrap.utils.generalUtils.setupAnonymous();
      const second = await bootstrap.utils.generalUtils.setupAnonymous();

      expect(first.apiKey.value.startsWith('ldi_')).toBe(true);
      expect(second.apiKey.value.startsWith('ldi_')).toBe(true);
      expect(first.apiKey.value).not.toBe(second.apiKey.value);
    });
  });
});
