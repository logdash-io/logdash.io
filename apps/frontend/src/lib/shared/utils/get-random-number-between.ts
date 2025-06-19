// Utility to get a random number between min and max (inclusive)
export function getRandomNumberBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
