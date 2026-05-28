import { BadRequestException } from '@nestjs/common';

const DURATION_PATTERN = /^(\d+)(m|h|d)$/;

const UNIT_MS: Record<string, number> = {
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parse a duration string (`30m`, `1h`, `24h`, `7d`) into the start Date of the
 * window, relative to `now`. Throws BadRequestException on a malformed value.
 */
export function parseSince(since: string, now: Date = new Date()): Date {
  const match = DURATION_PATTERN.exec(since);

  if (!match) {
    throw new BadRequestException(
      `Invalid "since" value "${since}". Expected a duration like 30m, 1h, 24h or 7d.`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (amount <= 0) {
    throw new BadRequestException(`Invalid "since" value "${since}". Duration must be positive.`);
  }

  return new Date(now.getTime() - amount * UNIT_MS[unit]);
}
