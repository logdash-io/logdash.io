import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { getEnvConfig } from '../../../shared/configs/env-configs';

@Injectable()
export class AdminGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminKey = request.headers['super-secret-admin-key'];

    if (adminKey !== getEnvConfig().admin.superSecretAdminKey) {
      throw new UnauthorizedException('Invalid admin key');
    }

    return true;
  }
}
