import type { CaptureResult } from 'posthog-js';

interface StackFrame {
  filename?: string;
  abs_path?: string;
  source?: string;
}

interface ExceptionListItem {
  stacktrace?: { frames?: StackFrame[] };
}

function isFirstPartyFrame(frame: StackFrame): boolean {
  const source = frame.filename ?? frame.abs_path ?? frame.source;
  if (typeof source !== 'string' || source.length === 0) {
    return false;
  }
  if (source.startsWith('/') && !source.startsWith('//')) {
    return true;
  }
  try {
    return new URL(source).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function dropThirdPartyExceptions(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event || event.event !== '$exception') {
    return event;
  }

  const exceptionList = event.properties?.$exception_list as
    | ExceptionListItem[]
    | undefined;
  if (!Array.isArray(exceptionList)) {
    return event;
  }

  const frames = exceptionList.flatMap(
    (exception) => exception.stacktrace?.frames ?? [],
  );
  if (frames.length === 0) {
    return event;
  }

  if (frames.some(isFirstPartyFrame)) {
    return event;
  }

  return null;
}
