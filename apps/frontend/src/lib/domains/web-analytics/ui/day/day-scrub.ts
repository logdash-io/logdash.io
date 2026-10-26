export type ScrubPoint = { x: number; y: number; time: number };

export const AIM_SPEED = 0.2;
export const REST_MS = 100;
export const SETTLE_MS = 90;

export class DayScrub {
  private engaged = false;
  private last: ScrubPoint | null = null;
  private column: number | null = null;
  private enteredAt = 0;
  private settled: number | null = null;

  public move(point: ScrubPoint, column: number | null): number | null {
    const speed = this.last
      ? Math.hypot(point.x - this.last.x, point.y - this.last.y) /
        Math.max(1, point.time - this.last.time)
      : Infinity;
    this.last = point;
    if (column !== this.column) {
      this.settle(point.time);
      this.column = column;
      this.enteredAt = point.time;
    }
    if (speed <= AIM_SPEED) this.engaged = true;
    return this.engaged ? this.column : null;
  }

  public rest(): number | null {
    this.engaged = true;
    return this.column;
  }

  public leave(time: number): number | null {
    this.settle(time);
    const target = this.engaged ? this.settled : null;
    this.engaged = false;
    this.last = null;
    this.column = null;
    this.settled = null;
    return target;
  }

  private settle(time: number): void {
    if (this.column !== null && time - this.enteredAt >= SETTLE_MS)
      this.settled = this.column;
  }
}
