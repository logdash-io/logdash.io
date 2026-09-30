import type { CaptureResult } from 'posthog-js';

type ExceptionList = { stacktrace?: { frames?: { filename?: string }[] } }[];

export function dropThirdPartyExceptions(
  event: CaptureResult | null,
  origin: string = location.origin,
): CaptureResult | null {
  if (event?.event !== '$exception') {
    return event;
  }

  const exceptions = event.properties.$exception_list as
    | ExceptionList
    | undefined;
  const frames =
    exceptions?.flatMap((exception) => exception.stacktrace?.frames ?? []) ??
    [];

  if (frames.length === 0) {
    return event;
  }

  return frames.some(({ filename }) => isFirstParty(filename, origin))
    ? event
    : null;
}

function isFirstParty(filename: string | undefined, origin: string): boolean {
  if (!filename) {
    return false;
  }

  if (filename.startsWith('/') && !filename.startsWith('//')) {
    return true;
  }

  try {
    return new URL(filename).origin === origin;
  } catch {
    return false;
  }
}
