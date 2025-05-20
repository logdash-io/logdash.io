require('dotenv').config();

export enum OurEnv {
  Local = 'local',
  Dev = 'dev',
  Prod = 'prod',
}

export function getOurEnv(): OurEnv {
  return process.env.OUR_ENV as OurEnv;
}
