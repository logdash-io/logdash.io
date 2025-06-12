export type HttpPing = {
	id: string;
	httpMonitorId: string;
	statusCode: number;
	responseTimeMs: number;
	message?: string;
	createdAt: Date;
};

export interface HttpPingCreatedEvent {
  id: string;
  httpMonitorId: string;
  statusCode: number;
  responseTimeMs: number;
  message?: string;
  createdAt: Date;
  clusterId: string;
}

