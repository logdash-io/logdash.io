import { sleep } from './sleep';

type WaitForOptions = { timeoutMs?: number; intervalMs?: number };

export async function waitFor<T>(
  read: () => Promise<T>,
  isReady: (value: T) => boolean,
  options: WaitForOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const intervalMs = options.intervalMs ?? 300;
  const deadline = Date.now() + timeoutMs;
  let value = await read();

  while (!isReady(value) && Date.now() < deadline) {
    await sleep(intervalMs);
    value = await read();
  }

  return value;
}
