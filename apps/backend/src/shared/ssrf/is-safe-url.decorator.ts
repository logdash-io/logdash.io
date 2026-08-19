import { buildMessage, registerDecorator, ValidationOptions } from 'class-validator';
import { isSafeUrlSyntax } from './safe-url';

/**
 * Fails fast on urls we will never be allowed to call: non http(s) schemes,
 * loopback / metadata hostnames and literal private ips. The authoritative
 * check happens at request time in `safeHttpRequest`, this one only keeps
 * obviously hostile values out of the database.
 */
export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isSafeUrl',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => typeof value === 'string' && isSafeUrlSyntax(value),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be an http(s) url that does not point at a private, loopback or metadata address`,
          validationOptions,
        ),
      },
    });
  };
}
