import { assertRequiredEnv } from './env-configs';

describe('assertRequiredEnv', () => {
  const { OUR_ENV, PERSONAL_API_KEY_HMAC_SECRET } = process.env;

  beforeEach(() => {
    process.env.OUR_ENV = 'prod';
  });

  afterEach(() => {
    process.env.OUR_ENV = OUR_ENV;
    process.env.PERSONAL_API_KEY_HMAC_SECRET = PERSONAL_API_KEY_HMAC_SECRET;
  });

  it('passes when every required variable is set', () => {
    expect(() => assertRequiredEnv()).not.toThrow();
  });

  it('names a required variable that is empty', () => {
    process.env.PERSONAL_API_KEY_HMAC_SECRET = '';

    expect(() => assertRequiredEnv()).toThrow('PERSONAL_API_KEY_HMAC_SECRET is not set');
  });
});
