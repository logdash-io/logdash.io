/**
 * `PUT /users/me` currently exposes no updatable fields. The body is
 * intentionally empty so that, with `whitelist` / `forbidNonWhitelisted`
 * enabled, any payload is rejected rather than silently ignored.
 */
export class UpdatePublicUserBody {}
