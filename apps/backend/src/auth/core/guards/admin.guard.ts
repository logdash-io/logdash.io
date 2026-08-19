import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { getEnvConfig } from '../../../shared/configs/env-configs';
import { secureCompare } from '../../../shared/utils/secure-compare';

@Injectable()
export class AdminGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminKey = request.headers['super-secret-admin-key'];
    const expectedAdminKey = getEnvConfig().admin.superSecretAdminKey;

    if (!expectedAdminKey) {
      throw new UnauthorizedException('Admin key is not configured');
    }

    if (!secureCompare(adminKey, expectedAdminKey)) {
      throw new UnauthorizedException('Invalid admin key');
    }

    return true;
  }
}
