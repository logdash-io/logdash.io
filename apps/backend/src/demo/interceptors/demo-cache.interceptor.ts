import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DEMO_ENDPOINT_KEY } from '../decorators/demo-endpoint.decorator';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { RedisService } from '../../shared/redis/redis.service';

const CACHE_TTL_S = 1;

@Injectable()
export class DemoCacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  public async intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Promise<Observable<unknown>> {
    const isDemoCacheEnabled = this.reflector.get<boolean>(DEMO_ENDPOINT_KEY, context.getHandler());

    if (!isDemoCacheEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const projectId = request.params.projectId;

    if (projectId !== getEnvConfig().demo.projectId) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = await this.tryGetCachedResponse(cacheKey);

    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap((response) => {
        void this.cacheResponse(cacheKey, response);
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    const { path, query } = request;
    return `demo-dashboard-path:${path}:${JSON.stringify(query)}`;
  }

  private async tryGetCachedResponse(cacheKey: string): Promise<unknown> {
    try {
      const cachedResponseRaw = await this.redisService.get(cacheKey);
      const cachedResponse: unknown = cachedResponseRaw ? JSON.parse(cachedResponseRaw) : null;
      return cachedResponse;
    } catch {
      return null;
    }
  }

  private async cacheResponse(cacheKey: string, response: unknown): Promise<void> {
    try {
      await this.redisService.set(cacheKey, JSON.stringify(response), CACHE_TTL_S);
    } catch (error) {
      console.error(error);
    }
  }
}
