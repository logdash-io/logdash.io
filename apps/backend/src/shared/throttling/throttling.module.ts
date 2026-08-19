import { Module } from '@nestjs/common';
import { seconds, ThrottlerModule } from '@nestjs/throttler';

/**
 * Single home for the throttler configuration so that both the application
 * bootstrap and the e2e test bootstrap register it identically.
 *
 * Intentionally not registered as a global APP_GUARD - log and metric ingest
 * are high volume and must never be rate limited here. Opt individual routes in
 * with the decorators exported from `./rate-limit.decorator`.
 */
@Module({
  imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: seconds(60), limit: 60 }] })],
})
export class ThrottlingModule {}
