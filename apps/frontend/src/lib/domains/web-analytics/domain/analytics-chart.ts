export function lastCurveSegment(curve: string): string {
  const last = curve.lastIndexOf('C');
  if (last < 0) return curve;
  const from = curve.slice(0, last).split(/[MC,]/).slice(-2).join();
  return `M${from}${curve.slice(last)}`;
}
