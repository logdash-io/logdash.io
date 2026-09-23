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
}

export {};
