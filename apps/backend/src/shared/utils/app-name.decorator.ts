import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { trimToUndefined } from './trim-to-undefined';

export const APP_NAME_MAX_LENGTH = 64;

export const AppName = (
  description = 'The app that sent this, such as desktop or api. With a domain key it picks the app and creates it on first use; a service key ignores it. Longer names are cut to 64 characters.',
): PropertyDecorator =>
  applyDecorators(
    ApiPropertyOptional({ description, maxLength: APP_NAME_MAX_LENGTH }),
    IsOptional(),
    IsString(),
    Transform((params: { value: unknown }) => {
      const value = trimToUndefined(params);

      return typeof value === 'string' ? value.substring(0, APP_NAME_MAX_LENGTH) : value;
    }),
  );
