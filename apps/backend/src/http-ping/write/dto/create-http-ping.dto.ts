
export class CreateHttpPingDto {
  httpMonitorId: string;
  statusCode: number;
  responseTimeMs: number;
  message?: string;
}
