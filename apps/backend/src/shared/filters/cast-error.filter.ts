import { ArgumentsHost, BadRequestException, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Error as MongooseError } from 'mongoose';

@Catch(MongooseError.CastError)
export class CastErrorFilter extends BaseExceptionFilter {
  public catch(_error: MongooseError.CastError, host: ArgumentsHost): void {
    super.catch(new BadRequestException('Invalid id'), host);
  }
}
