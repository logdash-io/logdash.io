export interface EnvironmentConfig {
  github: {
    clientId: string;
  };
  google: {
    clientId: string;
  };
  apiBaseUrl: string;
  stage: 'live' | 'preview' | 'local';
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    github: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    },
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    },
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    stage: import.meta.env.VITE_STAGE || 'local',
  };
}

export const envConfig = getEnvironmentConfig();
