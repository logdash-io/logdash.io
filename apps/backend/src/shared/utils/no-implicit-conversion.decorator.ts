import { Transform } from 'class-transformer';

export const NoImplicitConversion = (): PropertyDecorator =>
  Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key]);
