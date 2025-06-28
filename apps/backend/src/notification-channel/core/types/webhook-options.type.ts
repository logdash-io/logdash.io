import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

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
