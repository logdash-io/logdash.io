export interface EnvironmentConfig {
  posthog: {
    key: string;
    proxy: string;
    host: string;
  };
  github: {
    clientId: string;
  };
  google: {
    clientId: string;
  };
  bffLogdashApiKey: string;
  apiBaseUrl: string;
  stage: 'live' | 'pre-live' | 'local';
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    posthog: {
      key: import.meta.env.VITE_POSTHOG_KEY,
      proxy: import.meta.env.VITE_POSTHOG_PROXY,
      host: import.meta.env.VITE_POSTHOG_HOST,
    },
    github: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    },
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    },
    bffLogdashApiKey: import.meta.env.VITE_LOGDASH_API_KEY,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    stage: import.meta.env.VITE_STAGE || 'local',
  };
}

export const envConfig = getEnvironmentConfig();
