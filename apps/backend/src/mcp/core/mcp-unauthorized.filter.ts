import { ArgumentsHost, Catch, ExceptionFilter, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Catch(UnauthorizedException)
export class McpUnauthorizedFilter implements ExceptionFilter {
  public catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const metadataUrl = `${getEnvConfig().api.url}/.well-known/oauth-protected-resource/mcp`;

    response.setHeader('WWW-Authenticate', `Bearer resource_metadata="${metadataUrl}"`);
    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
