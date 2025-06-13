export class HttpPingNormalized {
  id: string;
  httpMonitorId: string;
  statusCode: number;
  responseTimeMs: number;
  message?: string;
  createdAt: Date;
}

export class HttpPingSerialized {
  id: string;
  httpMonitorId: string;
  statusCode: number;
  responseTimeMs: number;
  message?: string;
  createdAt: Date;
}
