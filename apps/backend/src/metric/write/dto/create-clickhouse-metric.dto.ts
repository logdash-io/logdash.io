export class CreateClickhouseMetricDto {
  id: string;
  metricRegisterEntryId: string;
  recordedAt: Date;
  value: number;
}
