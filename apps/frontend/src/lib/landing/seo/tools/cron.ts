import { match } from 'ts-pattern';

export type CronDialect = 'standard' | 'seconds' | 'quartz' | 'aws';

export type CronFieldKey =
  | 'second'
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek'
  | 'year';

export type CronFields = Partial<Record<CronFieldKey, string>>;

export type CronResult =
  | { ok: true; expression: string; meaning: string }
  | { ok: false; expression: string; errors: CronError[] };

export type CronError = { field: CronFieldKey | null; message: string };

type FieldSpec = {
  key: CronFieldKey;
  label: string;
  min: number;
  max: number;
  names?: string[];
  nameOffset?: number;
};

type DialectSpec = {
  label: string;
  fields: CronFieldKey[];
  dayOfWeekStart: 0 | 1;
  quartzRules: boolean;
  defaults: CronFields;
};

type Part =
  | { kind: 'all' }
  | { kind: 'any' }
  | { kind: 'value'; value: number }
  | { kind: 'range'; from: number; to: number }
  | { kind: 'step'; from: number | null; to: number | null; every: number }
  | { kind: 'special'; text: string };

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

export const DIALECTS: Record<CronDialect, DialectSpec> = {
  standard: {
    label: 'Standard',
    fields: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
    dayOfWeekStart: 0,
    quartzRules: false,
    defaults: {
      minute: '*/5',
      hour: '*',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    },
  },
  seconds: {
    label: 'With seconds',
    fields: ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
    dayOfWeekStart: 0,
    quartzRules: false,
    defaults: {
      second: '0',
      minute: '*/5',
      hour: '*',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    },
  },
  quartz: {
    label: 'Quartz',
    fields: [
      'second',
      'minute',
      'hour',
      'dayOfMonth',
      'month',
      'dayOfWeek',
      'year',
    ],
    dayOfWeekStart: 1,
    quartzRules: true,
    defaults: {
      second: '0',
      minute: '0/5',
      hour: '*',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '?',
      year: '*',
    },
  },
  aws: {
    label: 'AWS',
    fields: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek', 'year'],
    dayOfWeekStart: 1,
    quartzRules: true,
    defaults: {
      minute: '0/5',
      hour: '*',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '?',
      year: '*',
    },
  },
};

export function fieldSpec(dialect: CronDialect, key: CronFieldKey): FieldSpec {
  const dayOfWeekStart = DIALECTS[dialect].dayOfWeekStart;

  return match(key)
    .returnType<FieldSpec>()
    .with('second', () => ({ key, label: 'Second', min: 0, max: 59 }))
    .with('minute', () => ({ key, label: 'Minute', min: 0, max: 59 }))
    .with('hour', () => ({ key, label: 'Hour', min: 0, max: 23 }))
    .with('dayOfMonth', () => ({ key, label: 'Day', min: 1, max: 31 }))
    .with('month', () => ({
      key,
      label: 'Month',
      min: 1,
      max: 12,
      names: MONTHS,
      nameOffset: 1,
    }))
    .with('dayOfWeek', () => ({
      key,
      label: 'Weekday',
      min: dayOfWeekStart,
      max: 7,
      names: DAYS,
      nameOffset: dayOfWeekStart,
    }))
    .with('year', () => ({
      key,
      label: 'Year',
      min: 1970,
      max: dialect === 'aws' ? 2199 : 2099,
    }))
    .exhaustive();
}

export function formatExpression(
  dialect: CronDialect,
  fields: CronFields,
): string {
  const body = DIALECTS[dialect].fields
    .map((key) => (fields[key] ?? '').trim())
    .filter((value, index, values) => value || index < values.length - 1)
    .join(' ');

  return dialect === 'aws' ? `cron(${body})` : body;
}

export function parseExpression(
  dialect: CronDialect,
  expression: string,
): { ok: true; fields: CronFields } | { ok: false; message: string } {
  const spec = DIALECTS[dialect];
  const body = expression
    .trim()
    .replace(/^cron\((.*)\)$/i, '$1')
    .trim();
  const values = body ? body.split(/\s+/) : [];
  const optionalYear = dialect === 'quartz';
  const count = spec.fields.length;

  if (
    values.length !== count &&
    !(optionalYear && values.length === count - 1)
  ) {
    const expected = optionalYear ? `${count - 1} or ${count}` : `${count}`;

    return {
      ok: false,
      message: `${spec.label} cron has ${expected} fields, this has ${values.length}.`,
    };
  }

  return {
    ok: true,
    fields: Object.fromEntries(
      spec.fields.map((key, index) => [key, values[index] ?? '']),
    ),
  };
}

export function convertFields(
  from: CronDialect,
  to: CronDialect,
  fields: CronFields,
): CronFields {
  const source = DIALECTS[from];
  const target = DIALECTS[to];
  const next: CronFields = Object.fromEntries(
    target.fields.map((key) => [key, fields[key] ?? target.defaults[key]]),
  );

  if (source.dayOfWeekStart !== target.dayOfWeekStart && next.dayOfWeek) {
    next.dayOfWeek = next.dayOfWeek
      .split(',')
      .map((token) => shiftDayOfWeek(token, target.dayOfWeekStart))
      .join(',');
  }

  const anyDay = (value = ''): boolean => value === '*' || value === '?';

  if (!target.quartzRules) {
    next.dayOfMonth = next.dayOfMonth === '?' ? '*' : next.dayOfMonth;
    next.dayOfWeek = next.dayOfWeek === '?' ? '*' : next.dayOfWeek;
  } else if (anyDay(next.dayOfMonth) && !anyDay(next.dayOfWeek)) {
    next.dayOfMonth = '?';
  } else {
    next.dayOfMonth = next.dayOfMonth === '?' ? '*' : next.dayOfMonth;
    next.dayOfWeek = '?';
  }

  return next;
}

export function evaluate(dialect: CronDialect, fields: CronFields): CronResult {
  const spec = DIALECTS[dialect];
  const expression = formatExpression(dialect, fields);
  const parsed: Partial<Record<CronFieldKey, Part[]>> = {};
  const errors: CronError[] = [];

  for (const key of spec.fields) {
    const result = parseField(dialect, key, (fields[key] ?? '').trim());

    if (typeof result === 'string') {
      errors.push({
        field: key,
        message: `${fieldSpec(dialect, key).label}: ${result}`,
      });
    } else {
      parsed[key] = result;
    }
  }

  if (spec.quartzRules) {
    const questionMarks = [fields.dayOfMonth, fields.dayOfWeek].filter(
      (value) => value?.trim() === '?',
    ).length;

    if (questionMarks !== 1) {
      errors.push({
        field: null,
        message: `${spec.label} needs ? in exactly one of day and weekday.`,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, expression, errors };
  }

  return { ok: true, expression, meaning: describe(dialect, parsed) };
}

function shiftDayOfWeek(token: string, toStart: 0 | 1): string {
  const [base, step] = token.split('/');
  const shift = (day: string): number =>
    toStart === 1 ? (Number(day) % 7) + 1 : Number(day) - 1;
  const range = base.match(/^(\d+)-(\d+)$/);
  const single = base.match(/^(\d+)(L|#\d+)?$/);
  let shifted = base;

  if (range) {
    const from = shift(range[1]);
    const to = shift(range[2]);
    shifted = `${from}-${toStart === 0 && to < from ? 7 : to}`;
  } else if (single) {
    shifted = `${shift(single[1])}${single[2] ?? ''}`;
  }

  return step === undefined ? shifted : `${shifted}/${step}`;
}

function parseField(
  dialect: CronDialect,
  key: CronFieldKey,
  raw: string,
): Part[] | string {
  const quartzRules = DIALECTS[dialect].quartzRules;
  const isDay = key === 'dayOfMonth' || key === 'dayOfWeek';

  if (!raw) {
    return key === 'year' && dialect === 'quartz'
      ? [{ kind: 'all' }]
      : 'required.';
  }

  if (raw === '?') {
    return quartzRules && isDay
      ? [{ kind: 'any' }]
      : `? only works in the day fields of Quartz and AWS cron.`;
  }

  const tokens = raw.split(',');

  if (
    dialect === 'aws' &&
    key === 'dayOfWeek' &&
    raw.includes('#') &&
    tokens.length > 1
  ) {
    return 'AWS allows only one expression when you use #.';
  }

  const parts: Part[] = [];

  for (const token of tokens) {
    const part = parseToken(dialect, fieldSpec(dialect, key), token);

    if (typeof part === 'string') {
      return part;
    }

    parts.push(part);
  }

  return parts;
}

function parseToken(
  dialect: CronDialect,
  spec: FieldSpec,
  token: string,
): Part | string {
  if (!token) {
    return 'empty value in a list.';
  }

  if (DIALECTS[dialect].quartzRules) {
    const special = parseSpecial(dialect, spec, token.toUpperCase());

    if (special) {
      return special;
    }
  }

  const [base, step, ...rest] = token.split('/');

  if (rest.length > 0) {
    return `"${token}" has more than one /.`;
  }

  if (step !== undefined) {
    return parseStep(dialect, spec, base, step);
  }

  if (base === '*') {
    return { kind: 'all' };
  }

  return parseRangeOrValue(dialect, spec, base);
}

function parseStep(
  dialect: CronDialect,
  spec: FieldSpec,
  base: string,
  step: string,
): Part | string {
  if (dialect === 'aws' && spec.key === 'dayOfWeek') {
    return 'AWS does not allow / in the weekday field.';
  }

  const every = Number(step);

  if (!/^\d+$/.test(step) || every < 1 || every > spec.max) {
    return `step "${step}" must be a whole number from 1 to ${spec.max}.`;
  }

  if (base === '*') {
    return { kind: 'step', from: null, to: null, every };
  }

  const start = parseRangeOrValue(dialect, spec, base);

  if (typeof start === 'string') {
    return start;
  }

  if (start.kind === 'range') {
    return { kind: 'step', from: start.from, to: start.to, every };
  }

  if (start.kind === 'value' && dialect === 'standard') {
    return `standard cron needs * or start-end before /, e.g. ${base}-${spec.max}/${step}.`;
  }

  return start.kind === 'value'
    ? { kind: 'step', from: start.value, to: null, every }
    : `"${base}/${step}" is not a valid step.`;
}

function parseRangeOrValue(
  dialect: CronDialect,
  spec: FieldSpec,
  base: string,
): Part | string {
  const bounds = base.split('-');

  if (bounds.length > 2) {
    return `"${base}" is not a valid range.`;
  }

  const values: number[] = [];

  for (const bound of bounds) {
    const value = parseValue(spec, bound);

    if (typeof value === 'string') {
      return value;
    }

    values.push(value);
  }

  if (values.length === 1) {
    return { kind: 'value', value: values[0] };
  }

  const [from, to] = values;
  const wraps = DIALECTS[dialect].quartzRules;

  if (from > to && !wraps) {
    return `range "${base}" runs backwards.`;
  }

  return { kind: 'range', from, to };
}

function parseValue(spec: FieldSpec, raw: string): number | string {
  const nameIndex = spec.names?.findIndex(
    (name) => name.slice(0, 3).toUpperCase() === raw.toUpperCase(),
  );

  if (nameIndex !== undefined && nameIndex !== -1) {
    return nameIndex + (spec.nameOffset ?? 0);
  }

  const value = Number(raw);

  if (!/^\d+$/.test(raw) || value < spec.min || value > spec.max) {
    return `"${raw}" is outside ${spec.min}-${spec.max}.`;
  }

  return value;
}

function parseSpecial(
  dialect: CronDialect,
  spec: FieldSpec,
  token: string,
): Part | null {
  const quartz = dialect === 'quartz';

  if (spec.key === 'dayOfMonth') {
    const nearest = token.match(/^(\d+)W$/);
    const offset = token.match(/^L-(\d+)$/);

    if (token === 'L') {
      return { kind: 'special', text: 'on the last day of the month' };
    }

    if (token === 'LW' && quartz) {
      return { kind: 'special', text: 'on the last weekday of the month' };
    }

    if (offset && quartz && Number(offset[1]) >= 1 && Number(offset[1]) <= 30) {
      const days = Number(offset[1]);
      return {
        kind: 'special',
        text: `${days} day${days === 1 ? '' : 's'} before the last day of the month`,
      };
    }

    if (nearest && Number(nearest[1]) >= 1 && Number(nearest[1]) <= 31) {
      return {
        kind: 'special',
        text: `on the weekday nearest day ${Number(nearest[1])} of the month`,
      };
    }
  }

  if (spec.key === 'dayOfWeek') {
    const last = token.match(/^(\w{1,3})L$/);
    const nth = token.match(/^(\w{1,3})#([1-5])$/);

    if (token === 'L') {
      return { kind: 'special', text: 'on Saturday' };
    }

    if (last && typeof parseValue(spec, last[1]) === 'number') {
      return {
        kind: 'special',
        text: `on the last ${dayName(spec, parseValue(spec, last[1]) as number)} of the month`,
      };
    }

    if (nth && typeof parseValue(spec, nth[1]) === 'number') {
      return {
        kind: 'special',
        text: `on the ${ORDINALS[Number(nth[2]) - 1]} ${dayName(spec, parseValue(spec, nth[1]) as number)} of the month`,
      };
    }
  }

  return null;
}

function describe(
  dialect: CronDialect,
  parts: Partial<Record<CronFieldKey, Part[]>>,
): string {
  const day = (key: CronFieldKey): FieldSpec => fieldSpec(dialect, key);
  const phrases = [
    describeTime(parts.second, parts.minute ?? [], parts.hour ?? []),
    describeDays(
      dialect,
      describeField(parts.dayOfMonth, day('dayOfMonth')),
      describeField(parts.dayOfWeek, day('dayOfWeek')),
    ),
    describeField(parts.month, day('month')),
    describeField(parts.year, day('year')),
  ].filter(Boolean);
  const sentence = phrases.join(', ');

  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

function describeTime(
  second: Part[] | undefined,
  minute: Part[],
  hour: Part[],
): string {
  const secondValue = second ? singleValue(second) : 0;
  const minuteValue = singleValue(minute);
  const hours = plainValues(hour);

  if (secondValue !== null && minuteValue !== null && hours) {
    return `at ${list(hours.map((value) => clock(value, minuteValue, secondValue)))}`;
  }

  const phrases: string[] = [];

  if (second && secondValue !== 0) {
    phrases.push(unitPhrase(second, 'second'));
  }

  if (isAll(minute)) {
    if (!second || secondValue !== null) {
      phrases.push('every minute');
    }
  } else {
    const pastEveryHour = isAll(hour) && minuteValue !== null;
    phrases.push(
      `${unitPhrase(minute, 'minute')}${pastEveryHour ? ' past every hour' : ''}`,
    );
  }

  if (!isAll(hour)) {
    phrases.push(hourPhrase(hour));
  }

  return phrases.join(', ');
}

function describeDays(
  dialect: CronDialect,
  dayOfMonth: string,
  dayOfWeek: string,
): string {
  if (dayOfMonth && dayOfWeek && !DIALECTS[dialect].quartzRules) {
    return `${dayOfMonth} or ${dayOfWeek}`;
  }

  return [dayOfMonth, dayOfWeek].filter(Boolean).join(', ');
}

function describeField(parts: Part[] | undefined, spec: FieldSpec): string {
  if (
    !parts ||
    parts.every((part) => part.kind === 'all' || part.kind === 'any')
  ) {
    return '';
  }

  const values = plainValues(parts);
  const label = (value: number): string => valueLabel(spec, value);

  if (values) {
    return match(spec.key)
      .with(
        'dayOfMonth',
        () =>
          `on day${values.length > 1 ? 's' : ''} ${list(values.map(label))} of the month`,
      )
      .with('dayOfWeek', () => `on ${list(values.map(label))}`)
      .otherwise(() => `in ${list(values.map(label))}`);
  }

  const [unit, units] = match(spec.key)
    .with('dayOfMonth', () => ['day', 'days'])
    .with('dayOfWeek', () => ['day of the week', 'days of the week'])
    .otherwise(() => [spec.key, `${spec.key}s`]);

  return list(
    parts.map((part) =>
      match(part)
        .with({ kind: 'all' }, { kind: 'any' }, () => `every ${unit}`)
        .with({ kind: 'special' }, ({ text }) => text)
        .with({ kind: 'value' }, ({ value }) =>
          spec.key === 'dayOfMonth' ? `on day ${value}` : label(value),
        )
        .with({ kind: 'range' }, ({ from, to }) =>
          spec.key === 'dayOfMonth'
            ? `on days ${from} through ${to}`
            : `${label(from)} through ${label(to)}`,
        )
        .with({ kind: 'step' }, (step) =>
          stepPhrase(step, { unit, units, min: spec.min, label }),
        )
        .exhaustive(),
    ),
  );
}

function unitPhrase(parts: Part[], unit: 'second' | 'minute'): string {
  const values = plainValues(parts);

  if (values) {
    return `at ${unit}${values.length > 1 ? 's' : ''} ${list(values.map(String))}`;
  }

  const label = (value: number): string => `${unit} ${value}`;

  return list(
    parts.map((part) =>
      match(part)
        .with({ kind: 'value' }, ({ value }) => `at ${label(value)}`)
        .with(
          { kind: 'range' },
          ({ from, to }) => `every ${unit} from ${label(from)} through ${to}`,
        )
        .with({ kind: 'step' }, (step) =>
          stepPhrase(step, { unit, units: `${unit}s`, min: 0, label }),
        )
        .otherwise(() => `every ${unit}`),
    ),
  );
}

function hourPhrase(parts: Part[]): string {
  const values = plainValues(parts);

  if (values) {
    return values.length === 1
      ? `between ${clock(values[0], 0)} and ${clock(values[0], 59)}`
      : `during the ${list(values.map((value) => clock(value, 0)))} hours`;
  }

  return list(
    parts.map((part) =>
      match(part)
        .with(
          { kind: 'value' },
          ({ value }) => `during the ${clock(value, 0)} hour`,
        )
        .with(
          { kind: 'range' },
          ({ from, to }) => `between ${clock(from, 0)} and ${clock(to, 59)}`,
        )
        .with({ kind: 'step' }, (step) =>
          stepPhrase(step, {
            unit: 'hour',
            units: 'hours',
            min: 0,
            label: (value) => clock(value, 0),
          }),
        )
        .otherwise(() => 'every hour'),
    ),
  );
}

function stepPhrase(
  step: Extract<Part, { kind: 'step' }>,
  wording: {
    unit: string;
    units: string;
    min: number;
    label: (value: number) => string;
  },
): string {
  const { unit, units, min, label } = wording;
  const every =
    step.every === 1 ? `every ${unit}` : `every ${step.every} ${units}`;

  if (step.to !== null && step.from !== null) {
    return `${every} from ${label(step.from)} through ${label(step.to)}`;
  }

  if (step.from !== null && step.from > min) {
    return `${every} starting at ${label(step.from)}`;
  }

  return every;
}

function valueLabel(spec: FieldSpec, value: number): string {
  if (spec.key === 'dayOfWeek') {
    return dayName(spec, value);
  }

  if (spec.key === 'month') {
    return MONTHS[value - 1];
  }

  return String(value);
}

function dayName(spec: FieldSpec, value: number): string {
  return DAYS[(value - (spec.nameOffset ?? 0)) % 7];
}

function singleValue(parts: Part[]): number | null {
  const [part] = parts;

  return parts.length === 1 && part.kind === 'value' ? part.value : null;
}

function plainValues(parts: Part[]): number[] | null {
  const values = parts.flatMap((part) =>
    part.kind === 'value' ? [part.value] : [],
  );

  return values.length === parts.length ? values : null;
}

function isAll(parts: Part[]): boolean {
  return parts.length === 1 && parts[0].kind === 'all';
}

function clock(hour: number, minute: number, second = 0): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const time = `${pad(hour)}:${pad(minute)}`;

  return second ? `${time}:${pad(second)}` : time;
}

function list(items: string[]): string {
  return items.length < 3
    ? items.join(' and ')
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}
