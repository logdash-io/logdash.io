import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsMock {
  set(): void {}
  mutate(): void {}
}
