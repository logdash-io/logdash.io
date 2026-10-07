import { ArgumentsHost, Catch, HttpException, HttpServer } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request } from 'express';
import { LogdashLogger } from '../logdash/aggregate-logger';
import { LogdashMetrics } from '../logdash/aggregate-metrics';
import { errorMessage } from '../utils/error-message';

@Catch()
export class UnhandledErrorFilter extends BaseExceptionFilter {
  constructor(
    private readonly logger: LogdashLogger,
    private readonly metrics: LogdashMetrics,
    applicationRef: HttpServer,
  ) {
    super(applicationRef);
  }

  public catch(exception: unknown, host: ArgumentsHost): void {
    if (!(exception instanceof HttpException) && host.getType() === 'http') {
      const request = host.switchToHttp().getRequest<Request>();
      const route: unknown = request.route;

      this.logger.error('Unhandled request error', {
        method: request.method,
        route: (route as { path?: string } | undefined)?.path ?? 'unknown',
        error: errorMessage(exception),
      });
      this.metrics.mutateMetric('unhandledErrors', 1);
    }

    super.catch(exception, host);
  }
}
