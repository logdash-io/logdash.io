import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user?.id;
  },
);
