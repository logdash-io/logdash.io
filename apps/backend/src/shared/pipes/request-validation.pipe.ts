import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';

export const MAX_REQUEST_DEPTH = 64;

export class RequestValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
  }

  public override async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    if (nestsDeeperThan(value, MAX_REQUEST_DEPTH))
      throw new BadRequestException(`The request nests deeper than ${MAX_REQUEST_DEPTH} levels`);
    return super.transform(value, metadata);
  }
}

export function nestsDeeperThan(value: unknown, limit: number): boolean {
  const pending: [unknown, number][] = [[value, 0]];
  while (pending.length) {
    const [item, depth] = pending.pop()!;
    if (typeof item !== 'object' || item === null) continue;
    if (depth >= limit) return true;
    for (const child of Object.values(item)) pending.push([child, depth + 1]);
  }
  return false;
}
