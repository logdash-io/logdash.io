import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { WebAnalyticsReadModule } from '../read/web-analytics-read.module';
import { WebAnalyticsWriteModule } from '../write/web-analytics-write.module';
import { WebAnalyticsIngestionModule } from '../ingestion/web-analytics-ingestion.module';
import { WebAnalyticsCoreController } from './web-analytics-core.controller';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';

@Module({
  imports: [
    WebAnalyticsReadModule,
    WebAnalyticsWriteModule,
    WebAnalyticsIngestionModule,
    ClusterReadModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [WebAnalyticsCoreController],
})
export class WebAnalyticsCoreModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(parsePlainTextJson)
      .forRoutes({ path: 'web_events', method: RequestMethod.POST });
  }
}

function parsePlainTextJson(request: Request, response: Response, next: NextFunction): void {
  if (!request.is('text/plain')) return next();
  const chunks: Buffer[] = [];
  let size = 0;
  request.on('data', (chunk: Buffer) => {
    size += chunk.length;
    chunks.push(chunk);
    if (size > 32_768) {
      response.status(413).end();
      request.destroy();
    }
  });
  request.on('end', () => {
    try {
      request.body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    } catch {
      request.body = {};
    }
    next();
  });
  request.on('error', next);
}
