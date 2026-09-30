import { AsyncLocalStorage } from 'node:async_hooks';
import { NextFunction, Request, Response } from 'express';

export const requestContext = new AsyncLocalStorage<{ personalApiKeyId?: string }>();

export const withRequestContext = (req: Request, res: Response, next: NextFunction): void =>
  requestContext.run({}, next);
