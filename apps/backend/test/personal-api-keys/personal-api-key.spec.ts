import * as request from 'supertest';
import { Types } from 'mongoose';
import { createTestApp } from '../utils/bootstrap';
import { Action } from '../../src/personal-api-key/core/enums/action.enum';
import { Resource } from '../../src/personal-api-key/core/enums/resource.enum';

describe('Personal API keys (CRUD under JWT)', () => {
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

  const createBody = () => ({
    label: 'My CLI key',
    scopes: [
      { resource: Resource.Logs, action: Action.Read },
      { resource: Resource.Metrics, action: Action.Read },
    ],
    access: { kind: 'all' },
  });

  describe('happy path create -> list -> whoami -> revoke', () => {
    it('creates a key returning the plaintext value once, then lists/whoami/revokes it', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      // create
      const createResponse = await request(bootstrap.app.getHttpServer())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send(createBody());

      expect(createResponse.status).toBe(201);
      expect(typeof createResponse.body.value).toBe('string');
      expect(createResponse.body.value.startsWith('ldp_')).toBe(true);
      expect(createResponse.body.prefix).toBe(createResponse.body.value.slice(0, 12));
      expect(createResponse.body.prefix.startsWith('ldp_')).toBe(true);
      expect(createResponse.body.id).toBeDefined();
      expect(createResponse.body.label).toBe('My CLI key');
      expect(createResponse.body.scopes).toHaveLength(2);

      const keyId = createResponse.body.id;
      const prefix = createResponse.body.prefix;

      // list
      const listResponse = await request(bootstrap.app.getHttpServer())
        .get('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(keyId);
      expect(listResponse.body[0].prefix).toBe(prefix);

      // whoami (JWT) returns identity
      const whoamiResponse = await request(bootstrap.app.getHttpServer())
        .get('/personal-api-keys/whoami')
        .set('Authorization', `Bearer ${token}`);

      expect(whoamiResponse.status).toBe(200);
      expect(whoamiResponse.body.userId).toBeDefined();
      expect(whoamiResponse.body.access).toEqual({ kind: 'all' });
      // JWT is implicitly all-access
      expect(Array.isArray(whoamiResponse.body.scopes)).toBe(true);
      expect(whoamiResponse.body.scopes.length).toBeGreaterThan(0);

      // revoke
      const deleteResponse = await request(bootstrap.app.getHttpServer())
        .delete(`/personal-api-keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(204);
    });
  });

  describe('create response secrecy', () => {
    it('returns value only on create; list never returns value or hash', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const createResponse = await request(bootstrap.app.getHttpServer())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send(createBody());

      expect(createResponse.body).toHaveProperty('value');
      expect(createResponse.body).not.toHaveProperty('hash');

      const listResponse = await request(bootstrap.app.getHttpServer())
        .get('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`);

      for (const key of listResponse.body) {
        expect(key).not.toHaveProperty('value');
        expect(key).not.toHaveProperty('hash');
      }
    });
  });

  describe('whoami identity (JWT)', () => {
    it('returns the authenticated user id under a session token', async () => {
      const { token, user } = await bootstrap.utils.generalUtils.setupAnonymous();

      const whoamiResponse = await request(bootstrap.app.getHttpServer())
        .get('/personal-api-keys/whoami')
        .set('Authorization', `Bearer ${token}`);

      expect(whoamiResponse.status).toBe(200);
      expect(whoamiResponse.body.userId).toBe(user.id);
    });
  });

  describe('ownership', () => {
    it('returns 403/404 when a non-owner tries to revoke a key', async () => {
      const owner = await bootstrap.utils.generalUtils.setupAnonymous();
      const other = await bootstrap.utils.generalUtils.setupAnonymous();

      const createResponse = await request(bootstrap.app.getHttpServer())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${owner.token}`)
        .send(createBody());

      const keyId = createResponse.body.id;

      const deleteResponse = await request(bootstrap.app.getHttpServer())
        .delete(`/personal-api-keys/${keyId}`)
        .set('Authorization', `Bearer ${other.token}`);

      expect([403, 404]).toContain(deleteResponse.status);

      // the key still belongs to the owner and is still listed for them
      const ownerList = await request(bootstrap.app.getHttpServer())
        .get('/personal-api-keys')
        .set('Authorization', `Bearer ${owner.token}`);

      expect(ownerList.body).toHaveLength(1);
      expect(ownerList.body[0].id).toBe(keyId);
    });

    it('returns 404 when revoking a non-existent key', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const deleteResponse = await request(bootstrap.app.getHttpServer())
        .delete(`/personal-api-keys/${new Types.ObjectId().toString()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('revoked keys are excluded from list', () => {
    it('does not return a revoked key in the list', async () => {
      const { token } = await bootstrap.utils.generalUtils.setupAnonymous();

      const createResponse = await request(bootstrap.app.getHttpServer())
        .post('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send(createBody());

      const keyId = createResponse.body.id;

      await request(bootstrap.app.getHttpServer())
        .delete(`/personal-api-keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`);

      const listResponse = await request(bootstrap.app.getHttpServer())
        .get('/personal-api-keys')
        .set('Authorization', `Bearer ${token}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(0);
    });
  });

  describe('authentication', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(bootstrap.app.getHttpServer()).get('/personal-api-keys');

      expect(response.status).toBe(401);
    });
  });
});
