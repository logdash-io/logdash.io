export interface HttpPingCreatedEvent {
  id: string;
  httpMonitorId: string;
  statusCode: number;
  responseTimeMs: number;
  message?: string;
  createdAt: Date;
  clusterId: string;
}
