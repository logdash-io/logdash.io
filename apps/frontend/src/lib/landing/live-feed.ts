export type FeedBurst = {
  /** Chance that the next item follows right behind this one. */
  chance: number;
  minMs: number;
  maxMs: number;
};

/**
 * Runs `run` at a jittered cadence. With `burst`, some items arrive in quick
 * succession, the way one request logs a few lines back to back.
 */
export function scheduleJittered(
  run: () => void,
  minMs: number,
  maxMs: number,
  burst?: FeedBurst,
): () => void {
  let timer = 0;

  const nextDelay = (): number => {
    const range =
      burst && Math.random() < burst.chance ? burst : { minMs, maxMs };

    return range.minMs + Math.random() * (range.maxMs - range.minMs);
  };

  const queue = (): void => {
    timer = window.setTimeout(() => {
      run();
      queue();
    }, nextDelay());
  };

  queue();

  return () => window.clearTimeout(timer);
}
