import { config } from 'dotenv';

config();

export enum OurEnv {
  Local = 'local',
  Prod = 'prod',
}

const OUR_ENV_BY_NAME = new Map<string, OurEnv>([
  ['dev', OurEnv.Local],
  [OurEnv.Local, OurEnv.Local],
  [OurEnv.Prod, OurEnv.Prod],
]);

export function getOurEnv(): OurEnv {
  const env = process.env.OUR_ENV;

  if (!env) {
    throw new Error('OUR_ENV is not set');
  }

  const ourEnv = OUR_ENV_BY_NAME.get(env);

  if (!ourEnv) {
    throw new Error(`Unsupported OUR_ENV: ${env}`);
  }

  return ourEnv;
}
