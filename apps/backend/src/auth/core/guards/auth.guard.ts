import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomJwtService } from '../../custom-jwt/custom-jwt.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/is-public';
import { DEMO_ENDPOINT_KEY } from '../../../demo/decorators/demo-endpoint.decorator';
import { getEnvConfig } from '../../../shared/configs/env-configs';
import { PersonalApiKeyAuthService } from '../../../personal-api-key/auth/personal-api-key-auth.service';
import { ALL_ACCESS } from '../../../personal-api-key/core/scope-presets';
import { Action } from '../../../personal-api-key/core/enums/action.enum';
import { ScopeEntry } from '../../../personal-api-key/core/types/scope-entry.type';
import { REQUIRE_SCOPE_KEY } from '../decorators/require-scope.decorator';
import { ALLOW_ANY_PERSONAL_KEY_KEY } from '../decorators/allow-any-personal-key.decorator';
import { PERSONAL_API_KEY_PREFIX } from '../../../personal-api-key/core/personal-api-key.token';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly personalApiKeyAuthService: PersonalApiKeyAuthService,
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

    if (
      isDemoEndpoint &&
      (this.isRelatedToDemoProject(request) || this.isRelatedToDemoCluster(request))
    ) {
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        return true;
      }
      const payload = await this.jwtService.getTokenPayload(token);

      if (!payload) {
        return true;
      }

      // Demo users are JWT-like; missing viaPersonalKey ⇒ all-access.
      request['user'] = payload;

      return true;
    }

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    if (token.startsWith(PERSONAL_API_KEY_PREFIX)) {
      const authed = await this.personalApiKeyAuthService.verify(token);

      if (!authed) {
        throw new UnauthorizedException();
      }

      request['user'] = {
        id: authed.userId,
        scopes: authed.scopes,
        access: authed.access,
        viaPersonalKey: true,
      };

      return this.enforceScope(context, request);
    }

    const payload = await this.jwtService.getTokenPayload(token);

    if (!payload) {
      throw new UnauthorizedException();
    }

    request['user'] = {
      id: payload.id,
      scopes: ALL_ACCESS,
      access: { kind: 'all' },
      viaPersonalKey: false,
    };

    return true;
  }

  private enforceScope(context: ExecutionContext, request: any): boolean {
    const allowAnyPersonalKey = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANY_PERSONAL_KEY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowAnyPersonalKey) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<{ resource: string; action: Action }>(
      REQUIRE_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Fail-closed: a personal key hitting an endpoint with no @RequireScope is denied.
    if (!required) {
      throw new ForbiddenException('This endpoint is not available to personal API keys');
    }

    const scopes: ScopeEntry[] = request.user.scopes ?? [];
    const action = scopes.find((s) => s.resource === required.resource)?.action ?? Action.None;

    const ok =
      action === Action.Write || (action === Action.Read && required.action === Action.Read);

    if (!ok) {
      throw new ForbiddenException(`Missing scope ${required.resource}:${required.action}`);
    }

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
