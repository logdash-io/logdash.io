import { ApiProperty } from '@nestjs/swagger';
import { RateLimitScope } from '../enums/rate-limit-scope.enum';

export class RateLimit {
  @ApiProperty({ enum: RateLimitScope })
  scope: RateLimitScope;

  @ApiProperty()
  currentUsage: number;

  @ApiProperty()
  limit: number;
}
