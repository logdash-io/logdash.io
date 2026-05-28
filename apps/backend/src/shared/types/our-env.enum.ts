require('dotenv').config();

export enum OurEnv {
  Local = 'local',
  Prod = 'prod',
}

export function getOurEnv(): OurEnv {
  const env = process.env.OUR_ENV;

  if (!env || env === 'dev' || env === OurEnv.Local) {
    return OurEnv.Local;
  }

  if (env === OurEnv.Prod) {
    return OurEnv.Prod;
  }

  throw new Error(`Unsupported OUR_ENV: ${env}`);
}
