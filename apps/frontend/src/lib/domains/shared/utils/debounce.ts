/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<Args extends unknown[]>(
  func: (...args: Args) => unknown,
  wait: number,
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
