import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomJwtService } from '../../custom-jwt/custom-jwt.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/is-public';
import { DEMO_ENDPOINT_KEY } from '../../../demo/decorators/demo-endpoint.decorator';
import { getEnvConfig } from '../../../shared/configs/env-configs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: CustomJwtService,
    private reflector: Reflector,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isDemoEndpoint = this.reflector.get<boolean>(DEMO_ENDPOINT_KEY, context.getHandler());

    console.log('isDemoEndpoint', isDemoEndpoint);

    if (
      isDemoEndpoint &&
      (this.isRelatedToDemoProject(request) || this.isRelatedToDemoCluster(request))
    ) {
      const token = this.extractTokenFromHeader(request);

      console.log('token', token);

      if (!token) {
        return true;
      }
      const payload = await this.jwtService.getTokenPayload(token);

      console.log('payload', payload);

      if (!payload) {
        return true;
      }

      request['user'] = payload;

      console.log('payload', payload);

      return true;
    }

    const token = this.extractTokenFromHeader(request);

    console.log('token', token);

    if (!token) {
      throw new UnauthorizedException();
    }
    const payload = await this.jwtService.getTokenPayload(token);

    console.log('payload', payload);

    if (!payload) {
      throw new UnauthorizedException();
    }

    request['user'] = payload;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = (request.headers as any).authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private isRelatedToDemoProject(request: any): boolean {
    const projectId = request.params.projectId;

    return projectId === getEnvConfig().demo.projectId;
  }
  private isRelatedToDemoCluster(request: any): boolean {
    const clusterId = request.params.clusterId;

    return clusterId === getEnvConfig().demo.clusterId;
  }
}
