import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { IsSafeUrl } from '../../../shared/ssrf/is-safe-url.decorator';

export enum WebhookHttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

export class WebhookOptionsValidator {
  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  @IsUrl()
  @IsSafeUrl()
  public url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  public headers?: Record<string, string>;

  @ApiPropertyOptional({ enum: WebhookHttpMethod })
  @IsOptional()
  @IsEnum(WebhookHttpMethod)
  public method?: WebhookHttpMethod;
}

export interface WebhookOptions {
  url: string;
  headers?: Record<string, string>;
  method?: WebhookHttpMethod;
}
