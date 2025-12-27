export class Logdash {
  constructor(_apiKey: string, _options?: { host?: string }) {}

  public withNamespace(_namespace: string): Logdash {
    return this;
  }

  public debug(..._data: unknown[]): void {}
  public info(..._data: unknown[]): void {}
  public warn(..._data: unknown[]): void {}
  public error(..._data: unknown[]): void {}
  public http(..._data: unknown[]): void {}
  public log(..._data: unknown[]): void {}
  public silly(..._data: unknown[]): void {}
  public verbose(..._data: unknown[]): void {}

  public setMetric(_name: string, _value: number): void {}
  public mutateMetric(_name: string, _value: number): void {}

  public async flush(): Promise<void> {}
}
