require('dotenv').config();

export enum OurEnv {
  Dev = 'dev',
  Prod = 'prod',
}

export function getOurEnv(): OurEnv {
  return process.env.OUR_ENV as OurEnv;
}
