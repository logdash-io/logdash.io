export class RemoveLogMetricsDto {
  projectId: string;
  olderThan: Date;
  granularity: string;
}
