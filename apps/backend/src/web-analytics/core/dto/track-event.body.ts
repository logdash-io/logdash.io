import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsNotIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { AppName } from '../../../shared/utils/app-name.decorator';
import { BUILT_IN_EVENTS, EVENT_NAME } from './collect-web-events.body';

export class TrackEventBody {
  @ApiProperty({
    example: 'agent_run',
    description:
      'Matches [a-z][a-z0-9_]{0,63}. pageview, pageleave and browser_error belong to the website tracker.',
  })
  @Matches(EVENT_NAME)
  @IsNotIn(BUILT_IN_EVENTS)
  name: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
    example: { model: 'opus', tools: 3 },
    description:
      'Up to 10 keys matching [a-z][a-z0-9_]{0,39} with string, number or boolean values, stored as strings of up to 100 characters. Invalid entries and values containing @ or control characters are dropped, never the event.',
  })
  @Allow()
  props?: unknown;

  @ApiPropertyOptional({
    oneOf: [{ type: 'string' }, { type: 'number' }],
    example: '42',
    description:
      "The signed-in user's internal ID, never an email address. The server stores only sha256(siteId:userId), the hash the website tracker's identify sends, so the same user is one person across your website and apps. Without it, the event counts toward a visitor of that app that changes every day.",
  })
  @IsOptional()
  @Transform(({ obj }: { obj: { userId?: unknown } }) =>
    obj.userId === '' || obj.userId === null
      ? undefined
      : typeof obj.userId === 'number' && Number.isFinite(obj.userId)
        ? String(obj.userId)
        : obj.userId,
  )
  @IsString()
  @MaxLength(256)
  @Matches(/^[^@]+$/, { message: 'userId must be an internal ID, never an email address' })
  userId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'A UUID v4 for this event. Send the same one when you retry, so it is stored once.',
  })
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @AppName(
    'The app that sent the event, such as desktop or api. With a domain key it names the app and defaults to default; a service key uses its service name. Longer names are cut to 64 characters.',
  )
  app?: string;
}
