---
name: backend-notification-channel
description: Add a new notification channel type (Slack, Discord, email, SMS...) or a new alert message to the NestJS backend (apps/backend/src/notification-channel) - options validation, tier gating, secret handling, the provider, and tests. Use when the product needs to deliver alerts somewhere new or send a new kind of message through existing channels.
---

# Notification channel type

A channel is a cluster-owned Mongo document with a `target` (the type) and free-form `options`.
Monitors reference channels by id. When a monitor changes status, `NotificationChannelMessagingService` picks the provider for each channel's target and sends.

Webhook is the reference for an HTTP-based type. Telegram is the reference for one with a setup flow (`setup/telegram/`).

## Touch points, in order

1. **Type**: add the value to `NotificationChannelType` in `core/enums/notification-target.enum.ts`.
2. **Options**: `core/types/<type>-options.type.ts` with a `<Type>OptionsValidator` class (class-validator + `@ApiProperty`) and a `<Type>Options` interface. Bound every string with `@MaxLength`. Any URL the server calls gets `@IsUrl()` and `@IsSafeUrl()`.
3. **Entity union**: add `<Type>Options` to `NotificationChannelOptions` in `core/entities/notification-channel.entity.ts`.
4. **Bodies**: in both `create-notification-channel.body.ts` and `update-notification-channel.body.ts`, add the validator to `@ApiExtraModels`, to the `oneOf` list, and a branch to the `@Transform`.
5. **Options validation**: in `notification-channel-options-validation.service.ts`, `validateOptionsShape` picks the validator with a two-way ternary (Telegram, else Webhook). Replace it with an explicit mapping per type, or the new type is validated as a webhook. Add type-specific rules (uniqueness, tier restrictions) next to the existing ones.
6. **Defaults**: fill server-side defaults in `notification-channel-options-enrichment.service.ts` if the type has any.
7. **Secrets**: tokens and secret urls must not be returned. Strip them in `NotificationChannelSerializer.serialize`, like `serializeTelegramOptions` does.
8. **Plan**: add the type to `notificationChannels.allowedTypes` for the tiers that get it in `src/shared/configs/user-plan-configs.ts`. The controller rejects the rest.
9. **Provider**: `messaging/providers/<type>.notification-channel-provider.ts` implementing `NotificationChannelProvider` (`sendHttpMonitorAlertMessage`, `sendWelcomeMessage`).
10. **Registration**: add the provider to `messagingProviders` in `notification-channel-messaging.module.ts`, inject it in `NotificationChannelMessagingService`, and add a branch to `pickProvider`.
11. **Tests**: see below.

## Provider rules

- Send user-configured HTTP with `safeHttpRequest` from `src/shared/ssrf/safe-http-request.ts`. It blocks private and internal addresses at connect time. Fixed provider hosts (like the Telegram API) can use axios directly.
- Catch delivery errors inside the provider and log them. One broken channel must not stop the others, since `sendHttpMonitorAlertMessage` fans out with `Promise.all`.
- Log the origin, method, status code and header names only. Never the full url, header values, tokens or bodies (see the helpers at the top of `webhook.notification-channel-provider.ts`).
- `sendWelcomeMessage` runs when the channel is created. Return `Promise.resolve()` if the type has nothing to say.

## New message kind

To send something other than monitor alerts, add a method to `NotificationChannelProvider`, implement it in every provider, and add a fan-out method to `NotificationChannelMessagingService` like `sendHttpMonitorAlertMessage`.
Trigger it from an event listener, not from a request handler (see backend-events-and-crons).

## Tests

- `test/notification-channel/providers/<type>.spec.ts`, modeled on `webhook.spec.ts`: create the channel through the API, call `NotificationChannelMessagingService` from `bootstrap.app.get(...)`, and assert the outbound request with `nock`.
- Add `create<Type>NotificationChannel` to `test/utils/communication-channel-utils.ts`.
- In `test/notification-channel/writes.spec.ts`: create and update with valid options, invalid options rejected with 400, options of another type rejected on update, tier denial, secrets absent from responses.
