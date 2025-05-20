import { getOurEnv, OurEnv } from '../types/our-env.enum';

interface EnvConfig {
  emailLoginWhitelist: {
    enabled: boolean;
    whitelistedEmails: string[];
  };
  logdash: {
    apiKey: string;
  };
  telegram: {
    token: string;
    chatId: string;
  };
  stripe: {
    earlyBirdPriceId: string;
    successUrl: string;
    returnFromBillingUrl: string;
    apiKeySecret: string;
    signature: string;
  };
  logging: {
    logCreationDurationWarnThreshold: number;
  };
  anonymousAccounts: {
    removeAfterHours: number;
  };
  pings: {
    maxConcurrentRequests: number;
  };
  demo: {
    clusterId: string;
    projectId: string;
    logdashApiKey: string;
    logdashHost: string;
    addTestLogRateLimit: {
      timeWindowSeconds: number;
      limit: number;
    };
  };
  metrics: {
    metricCreationDurationWarnThreshold: number;
  };
  github: {
    clientId: string;
    clientSecret: string;
  };
  mongo: {
    url: string;
  };
  redis: {
    url: string;
  };
  resend: {
    enabled: boolean;
    apiKey: string;
  };
  auth: {
    jwtSecret: string;
  };
}

interface EnvConfigs {
  [OurEnv.Prod]: EnvConfig;
  [OurEnv.Dev]: EnvConfig;
  [OurEnv.Local]: EnvConfig;
}

export const EnvConfigs: EnvConfigs = {
  [OurEnv.Prod]: {
    emailLoginWhitelist: {
      enabled: false,
      whitelistedEmails: (process.env.WHITELISTED_EMAILS ?? '')!.split(','),
    },
    logdash: {
      apiKey: process.env.LOGDASH_API_KEY!,
    },
    telegram: {
      token: process.env.TELEGRAM_TOKEN!,
      chatId: '-1002637928179',
    },
    stripe: {
      earlyBirdPriceId: process.env.STRIPE_EARLY_BIRD_PRICE_ID!,
      successUrl: 'https://logdash.io/app/callbacks/payments/purchase-success',
      returnFromBillingUrl: 'https://logdash.io/app/clusters',
      apiKeySecret: process.env.STRIPE_API_KEY_SECRET!,
      signature: process.env.STRIPE_SIGNATURE!,
    },
    logging: {
      logCreationDurationWarnThreshold: 500,
    },
    anonymousAccounts: {
      removeAfterHours: 24 * 7, // 7 days
    },
    pings: {
      maxConcurrentRequests: 100,
    },
    demo: {
      clusterId: '682a50841175bcf07c63bbc4',
      projectId: '68279cf6295a5344e638bfc9',
      logdashApiKey: process.env.DEMO_DASHBOARD_API_KEY!,
      logdashHost: 'https://api.logdash.io',
      addTestLogRateLimit: {
        timeWindowSeconds: 60,
        limit: 10,
      },
    },
    metrics: {
      metricCreationDurationWarnThreshold: 500,
    },
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
    },
    mongo: {
      url: process.env.MONGO_URL!,
    },
    redis: {
      url: process.env.REDIS_URL!,
    },
    resend: {
      enabled: true,
      apiKey: process.env.RESEND_API_KEY!,
    },
    auth: {
      jwtSecret: process.env.AUTH_JWT_SECRET!,
    },
  },
  [OurEnv.Dev]: {
    emailLoginWhitelist: {
      enabled: true,
      whitelistedEmails: (process.env.WHITELISTED_EMAILS ?? '')!.split(','),
    },
    logdash: {
      apiKey: process.env.LOGDASH_API_KEY!,
    },
    telegram: {
      token: process.env.TELEGRAM_TOKEN!,
      chatId: '-1002535913992',
    },
    stripe: {
      earlyBirdPriceId: process.env.STRIPE_EARLY_BIRD_PRICE_ID!,
      successUrl: 'https://dev.logdash.io/app/callbacks/payments/purchase-success',
      returnFromBillingUrl: 'https://dev.logdash.io/app/clusters',
      apiKeySecret: process.env.STRIPE_API_KEY_SECRET!,
      signature: process.env.STRIPE_SIGNATURE!,
    },
    logging: {
      logCreationDurationWarnThreshold: 100,
    },
    anonymousAccounts: {
      removeAfterHours: 24 * 7, // 7 days
    },
    pings: {
      maxConcurrentRequests: 10,
    },
    demo: {
      clusterId: '682844d37f296819db10b9a5',
      projectId: '682844d37f296819db10b9a9',
      logdashApiKey: process.env.DEMO_DASHBOARD_API_KEY!,
      logdashHost: 'https://dev-api.logdash.io',
      addTestLogRateLimit: {
        timeWindowSeconds: 60,
        limit: 10,
      },
    },
    metrics: {
      metricCreationDurationWarnThreshold: 100,
    },
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
    },
    mongo: {
      url: process.env.MONGO_URL!,
    },
    redis: {
      url: process.env.REDIS_URL!,
    },
    resend: {
      enabled: true,
      apiKey: process.env.RESEND_API_KEY!,
    },
    auth: {
      jwtSecret: process.env.AUTH_JWT_SECRET!,
    },
  },
  [OurEnv.Local]: {
    emailLoginWhitelist: {
      enabled: true,
      whitelistedEmails: (process.env.WHITELISTED_EMAILS ?? '')!.split(','),
    },
    logdash: {
      apiKey: process.env.LOGDASH_API_KEY!,
    },
    telegram: {
      token: process.env.TELEGRAM_TOKEN!,
      chatId: '-1002535913992',
    },
    stripe: {
      earlyBirdPriceId: process.env.STRIPE_EARLY_BIRD_PRICE_ID!,
      successUrl: 'http://localhost:5173/app/callbacks/payments/purchase-success',
      returnFromBillingUrl: 'http://localhost:5173/app/clusters',
      apiKeySecret: process.env.STRIPE_API_KEY_SECRET!,
      signature: process.env.STRIPE_SIGNATURE!,
    },
    logging: {
      logCreationDurationWarnThreshold: 100,
    },
    anonymousAccounts: {
      removeAfterHours: 24 * 7, // 7 days
    },
    pings: {
      maxConcurrentRequests: 10,
    },
    demo: {
      clusterId: '682844d37f296819db10b9a5',
      projectId: '682844d37f296819db10b9a9',
      logdashApiKey: process.env.DEMO_DASHBOARD_API_KEY!,
      logdashHost: 'https://local-api.logdash.io',
      addTestLogRateLimit: {
        timeWindowSeconds: 60,
        limit: 10,
      },
    },
    metrics: {
      metricCreationDurationWarnThreshold: 100,
    },
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
    },
    mongo: {
      url: process.env.MONGO_URL!,
    },
    redis: {
      url: process.env.REDIS_URL!,
    },
    resend: {
      enabled: true,
      apiKey: process.env.RESEND_API_KEY!,
    },
    auth: {
      jwtSecret: process.env.AUTH_JWT_SECRET!,
    },
  },
};

export function getEnvConfig(): EnvConfig {
  const env = getOurEnv();
  return EnvConfigs[env];
}
