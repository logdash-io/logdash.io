export interface EnvironmentConfig {
  posthog: {
    key: string;
    proxy: string;
    host: string;
  };
  github: {
    clientId: string;
  };
  bffLogdashApiKey: string;
  apiBaseUrl: string;
  stage: "live" | "pre-live" | "local";
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = import.meta.env;

  console.log("env", env);
  return {
    posthog: {
      key: env.VITE_POSTHOG_KEY,
      proxy: env.VITE_POSTHOG_PROXY,
      host: env.VITE_POSTHOG_HOST,
    },
    github: {
      clientId: env.VITE_GITHUB_CLIENT_ID,
    },
    bffLogdashApiKey: env.VITE_LOGDASH_API_KEY,
    apiBaseUrl: env.VITE_API_BASE_URL,
    stage: env.VITE_STAGE || "local",
  };
}

export const envConfig = getEnvironmentConfig();
