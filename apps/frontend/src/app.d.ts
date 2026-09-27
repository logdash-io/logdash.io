// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        AI: {
          run(model: string, input: Record<string, unknown>): Promise<unknown>;
        };
        FAQ_ASK_LIMITER: {
          limit(options: { key: string }): Promise<{ success: boolean }>;
        };
      };
    }
  }

  interface ImportMetaEnv {
    readonly VITE_POSTHOG_KEY: string;
    readonly VITE_POSTHOG_PROXY: string;
    readonly VITE_POSTHOG_HOST: string;
    readonly VITE_GITHUB_CLIENT_ID: string;
    readonly VITE_GOOGLE_CLIENT_ID: string;
    readonly VITE_API_BASE_URL: string;
    readonly VITE_STAGE?: 'live' | 'preview' | 'local';
  }
}

export {};
