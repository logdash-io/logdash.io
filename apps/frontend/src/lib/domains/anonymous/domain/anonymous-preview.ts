import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error';
import { match } from 'ts-pattern';

export type AnonymousPreview = {
  token: string;
  clusterId: string;
  clusterName: string;
  monitorId: string;
  url: string;
  createdAt: number;
  anonymous: boolean;
};

export type AnonymousStartStep = 'account' | 'check';

export type AnonymousStartErrorKind =
  | 'rate-limited'
  | 'unsafe-url'
  | 'limit-reached'
  | 'unknown';

export class AnonymousStartError extends Error {
  public readonly kind: AnonymousStartErrorKind;

  constructor(kind: AnonymousStartErrorKind, message: string) {
    super(message);
    this.name = 'AnonymousStartError';
    this.kind = kind;
  }

  public static from(error: unknown): AnonymousStartError {
    if (error instanceof AnonymousStartError) {
      return error;
    }

    return AnonymousStartError.fromStatus(readHttpErrorStatus(error));
  }

  public static fromClaim(error: unknown): AnonymousStartError {
    if (error instanceof AnonymousStartError) {
      return error;
    }

    const status = readHttpErrorStatus(error);

    return match(status)
      .with(
        409,
        () =>
          new AnonymousStartError(
            'limit-reached',
            'This service already has its monitor. Open your dashboard to manage it.',
          ),
      )
      .otherwise(() => AnonymousStartError.fromStatus(status));
  }

  public static fromStatus(status?: number): AnonymousStartError {
    return match(status)
      .with(
        429,
        () =>
          new AnonymousStartError(
            'rate-limited',
            'Too many new dashboards from your network. Try again in a minute.',
          ),
      )
      .with(
        400,
        () => new AnonymousStartError('unsafe-url', 'Public URLs only.'),
      )
      .with(
        409,
        () =>
          new AnonymousStartError(
            'limit-reached',
            'Service limit reached. Open your dashboard to add it there.',
          ),
      )
      .otherwise(
        () =>
          new AnonymousStartError(
            'unknown',
            'Something went wrong. Please try again.',
          ),
      );
  }
}
