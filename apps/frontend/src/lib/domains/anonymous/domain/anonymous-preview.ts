import { match } from 'ts-pattern';

const MAX_NAME_LENGTH = 64;

export type AnonymousPreview = {
  token: string;
  clusterId: string;
  projectId: string;
  monitorId: string;
  url: string;
  createdAt: number;
};

export type AnonymousStartStep = 'account' | 'project' | 'check';

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
            'Project limit reached. Open your dashboard to add it there.',
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

export const previewNameFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.slice(0, MAX_NAME_LENGTH);
  } catch {
    return url.slice(0, MAX_NAME_LENGTH);
  }
};
