import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DEMO_ENDPOINT_KEY } from '../decorators/demo-endpoint.decorator';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { RedisService } from '../../shared/redis/redis.service';

const CACHE_TTL_S = 1;

@Injectable()
export class DemoCacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const isDemoCacheEnabled = this.reflector.get<boolean>(DEMO_ENDPOINT_KEY, context.getHandler());

    if (!isDemoCacheEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
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
        this.redisService.set(cacheKey, JSON.stringify(response), CACHE_TTL_S);
      }),
    );
  }

  private generateCacheKey(request: any): string {
    // Generate a unique key based on the request path and query parameters
    const { path, query } = request;
    return `demo-dashboard-path:${path}:${JSON.stringify(query)}`;
  }

  private async tryGetCachedResponse(cacheKey: string): Promise<unknown | null> {
    try {
      const cachedResponseRaw = await this.redisService.get(cacheKey);
      const cachedResponse = cachedResponseRaw ? JSON.parse(cachedResponseRaw) : null;
      return cachedResponse;
    } catch (error) {
      return null;
    }
  }
}
