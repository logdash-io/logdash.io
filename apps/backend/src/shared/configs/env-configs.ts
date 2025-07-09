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
    builderPriceId: string;
    proPriceId: string;

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
    ttlHours: number;
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
    clientIdAlternative?: string;
    clientSecretAlternative?: string;
  };
  mongo: {
    url: string;
  };
  redis: {
    url?: string;
    socketPath?: string;
    password?: string;
  };
  resend: {
    enabled: boolean;
    apiKey: string;
  };
  auth: {
    jwtSecret: string;
  };
  swagger: {
    username: string;
    password: string;
  };
  clickhouse: {
    host: string;
    username: string;
    password: string;
    database: string;
  };
  notificationChannels: {
    telegramUptimeBot: {
      secret: string;
      token: string;
    };
  };
  admin: {
    superSecretAdminKey: string;
  };
  internal: {
    telegram: {
      chatId: string;
      botToken: string;
    };
  };
  customDomain: {
    targetCname: string;
  };
}

interface EnvConfigs {
  [OurEnv.Prod]: EnvConfig;
  [OurEnv.Dev]: EnvConfig;
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
      builderPriceId: process.env.STRIPE_BUILDER_PRICE_ID!,
      proPriceId: process.env.STRIPE_PRO_PRICE_ID!,
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
      ttlHours: 12,
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
    swagger: {
      username: 'admin',
      password: process.env.SWAGGER_PASSWORD!,
    },
    clickhouse: {
      host: process.env.CLICKHOUSE_HOST!,
      username: process.env.CLICKHOUSE_USER!,
      password: process.env.CLICKHOUSE_PASSWORD!,
      database: process.env.CLICKHOUSE_DATABASE!,
    },
    notificationChannels: {
      telegramUptimeBot: {
        secret: process.env.TELEGRAM_UPTIME_BOT_SECRET!,
        token: process.env.TELEGRAM_UPTIME_BOT_TOKEN!,
      },
    },
    admin: {
      superSecretAdminKey: process.env.ADMIN_SUPER_SECRET_ADMIN_KEY!,
    },
    internal: {
      telegram: {
        botToken: process.env.INTERNAL_TELEGRAM_BOT_TOKEN!,
        chatId: '-1002678512492',
      },
    },
    customDomain: {
      targetCname: 'status.logdash.io',
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
      builderPriceId: process.env.STRIPE_BUILDER_PRICE_ID!,
      proPriceId: process.env.STRIPE_PRO_PRICE_ID!,
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
      ttlHours: 12,
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
      clientIdAlternative: process.env.GITHUB_OAUTH_CLIENT_ID_ALTERNATIVE!,
      clientSecretAlternative: process.env.GITHUB_OAUTH_CLIENT_SECRET_ALTERNATIVE!,
    },
    mongo: {
      url: process.env.MONGO_URL!,
    },
    redis: {
      url: undefined,
      socketPath: process.env.REDIS_SOCKET_PATH!,
      password: process.env.REDIS_PASSWORD!,
    },
    resend: {
      enabled: true,
      apiKey: process.env.RESEND_API_KEY!,
    },
    auth: {
      jwtSecret: process.env.AUTH_JWT_SECRET!,
    },
    swagger: {
      username: 'admin',
      password: process.env.SWAGGER_PASSWORD!,
    },
    clickhouse: {
      host: process.env.CLICKHOUSE_HOST!,
      username: process.env.CLICKHOUSE_USER!,
      password: process.env.CLICKHOUSE_PASSWORD!,
      database: process.env.CLICKHOUSE_DATABASE!,
    },
    notificationChannels: {
      telegramUptimeBot: {
        secret: process.env.TELEGRAM_UPTIME_BOT_SECRET!,
        token: process.env.TELEGRAM_UPTIME_BOT_TOKEN!,
      },
    },
    admin: {
      superSecretAdminKey: process.env.ADMIN_SUPER_SECRET_ADMIN_KEY!,
    },
    internal: {
      telegram: {
        botToken: process.env.INTERNAL_TELEGRAM_BOT_TOKEN!,
        chatId: '-1002678512492',
      },
    },
    customDomain: {
      targetCname: 'dev-status.logdash.io',
    },
  },
};

export function getEnvConfig(): EnvConfig {
  const env = getOurEnv();
  return EnvConfigs[env];
}
