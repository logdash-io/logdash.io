export class Logdash {
  public withNamespace(): Logdash {
    return this;
  }

  public debug(): void {}
  public info(): void {}
  public warn(): void {}
  public error(): void {}
  public http(): void {}
  public log(): void {}
  public silly(): void {}
  public verbose(): void {}

  public setMetric(): void {}
  public mutateMetric(): void {}

  public async flush(): Promise<void> {}
}
