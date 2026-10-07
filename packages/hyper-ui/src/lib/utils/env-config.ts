export interface EnvironmentConfig {
  github: {
    clientId: string;
  };
  apiBaseUrl: string;
  stage: "live" | "preview" | "local";
}

export function getEnvironmentConfig(): EnvironmentConfig {
  // @ts-ignore
  const env = import.meta.env;

  return {
    github: {
      clientId: env.VITE_GITHUB_CLIENT_ID,
    },
    apiBaseUrl: env.VITE_API_BASE_URL,
    stage: env.VITE_STAGE || "local",
  };
}

export const envConfig = getEnvironmentConfig();
