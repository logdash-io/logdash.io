import { Logdash } from '@logdash/node';

export interface LogdashMetrics {
  setMetric(name: string, value: number): void;
  mutateMetric(name: string, value: number): void;
}

export class AggregateMetrics implements LogdashMetrics {
  constructor(private readonly logdashInstances: Logdash[]) {}

  public mutateMetric(name: string, value: number): void {
    this.logdashInstances.forEach((instance) => instance.mutateMetric(name, value));
  }

  public setMetric(name: string, value: number): void {
    this.logdashInstances.forEach((instance) => instance.setMetric(name, value));
  }
}
