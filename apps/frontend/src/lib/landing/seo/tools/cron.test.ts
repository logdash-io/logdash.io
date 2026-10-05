import { expect, test } from '@playwright/test';
import {
  convertFields,
  DIALECTS,
  evaluate,
  parseExpression,
  type CronDialect,
} from './cron';

function explain(dialect: CronDialect, expression: string): string {
  const parsed = parseExpression(dialect, expression);

  if (!parsed.ok) {
    return parsed.message;
  }

  const result = evaluate(dialect, parsed.fields);

  return result.ok
    ? result.meaning
    : result.errors.map((error) => error.message).join(' ');
}

test('standard five-field cron', () => {
  expect(explain('standard', '*/5 * * * *')).toBe('Every 5 minutes.');
  expect(explain('standard', '* * * * *')).toBe('Every minute.');
  expect(explain('standard', '0 9 * * 1-5')).toBe(
    'At 09:00, Monday through Friday.',
  );
  expect(explain('standard', '15 * * * *')).toBe(
    'At minute 15 past every hour.',
  );
  expect(explain('standard', '0 0,12 1 * *')).toBe(
    'At 00:00 and 12:00, on day 1 of the month.',
  );
  expect(explain('standard', '*/15 9-17 * * mon-fri')).toBe(
    'Every 15 minutes, between 09:00 and 17:59, Monday through Friday.',
  );
  expect(explain('standard', '0 0 1 * 0')).toBe(
    'At 00:00, on day 1 of the month or on Sunday.',
  );
  expect(explain('standard', '30 4 * 1,7 7')).toBe(
    'At 04:30, on Sunday, in January and July.',
  );
});

test('standard cron rejects what crond rejects', () => {
  expect(explain('standard', '60 * * * *')).toBe(
    'Minute: "60" is outside 0-59.',
  );
  expect(explain('standard', '0 9 * *')).toBe(
    'Standard cron has 5 fields, this has 4.',
  );
  expect(explain('standard', '5/15 * * * *')).toContain('needs * or start-end');
  expect(explain('standard', '0 9 ? * *')).toContain('? only works');
  expect(explain('standard', '0 17-9 * * *')).toContain('runs backwards');
  expect(explain('standard', '*/0 * * * *')).toContain('step "0"');
});

test('six fields with seconds', () => {
  expect(explain('seconds', '*/10 * * * * *')).toBe('Every 10 seconds.');
  expect(explain('seconds', '* * * * * *')).toBe('Every second.');
  expect(explain('seconds', '30 0 9 * * *')).toBe('At 09:00:30.');
  expect(explain('seconds', '0 */5 * * * *')).toBe('Every 5 minutes.');
});

test('Quartz: seven fields, ? rules, L, W and #', () => {
  expect(explain('quartz', '0 0/5 * * * ? *')).toBe('Every 5 minutes.');
  expect(explain('quartz', '0 15 10 ? * 6L')).toBe(
    'At 10:15, on the last Friday of the month.',
  );
  expect(explain('quartz', '0 0 12 ? * 2#1 *')).toBe(
    'At 12:00, on the first Monday of the month.',
  );
  expect(explain('quartz', '0 0 18 LW * ?')).toBe(
    'At 18:00, on the last weekday of the month.',
  );
  expect(explain('quartz', '0 0 9 15W * ? 2027')).toBe(
    'At 09:00, on the weekday nearest day 15 of the month, in 2027.',
  );
  expect(explain('quartz', '0 0 9 * * *')).toContain('exactly one');
  expect(explain('quartz', '0 0 9 ? * ?')).toContain('exactly one');
  expect(explain('quartz', '0 0 9 ? * 0')).toBe('Weekday: "0" is outside 1-7.');
});

test('AWS EventBridge cron(...)', () => {
  expect(explain('aws', 'cron(0 18 ? * MON-FRI *)')).toBe(
    'At 18:00, Monday through Friday.',
  );
  expect(explain('aws', 'cron(0/30 20-2 ? * MON-FRI *)')).toBe(
    'Every 30 minutes, between 20:00 and 02:59, Monday through Friday.',
  );
  expect(explain('aws', 'cron(15 10 ? * 6L 2019-2022)')).toBe(
    'At 10:15, on the last Friday of the month, 2019 through 2022.',
  );
  expect(explain('aws', '0 8 1 * ? *')).toBe(
    'At 08:00, on day 1 of the month.',
  );
  expect(explain('aws', 'cron(0 8 1 * ? 2200)')).toBe(
    'Year: "2200" is outside 1970-2199.',
  );
  expect(explain('aws', 'cron(0 8 ? * 3#1,6#3 *)')).toContain('only one');
  expect(explain('aws', 'cron(0 8 ? * */2 *)')).toContain('does not allow /');
  expect(explain('aws', 'cron(0 0 L-2 * ? *)')).toContain('Day');
});

test('switching dialects keeps the schedule', () => {
  const weekdays = {
    minute: '0',
    hour: '9',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '1-5',
  };
  const quartz = convertFields('standard', 'quartz', weekdays);
  const aws = convertFields('quartz', 'aws', quartz);
  const back = convertFields('aws', 'standard', aws);

  expect(quartz).toEqual({
    ...weekdays,
    second: '0',
    dayOfMonth: '?',
    dayOfWeek: '2-6',
    year: '*',
  });
  expect(evaluate('aws', aws)).toMatchObject({
    ok: true,
    expression: 'cron(0 9 ? * 2-6 *)',
    meaning: 'At 09:00, Monday through Friday.',
  });
  expect(back).toEqual(weekdays);

  for (const dialect of Object.keys(DIALECTS) as CronDialect[]) {
    expect(evaluate(dialect, DIALECTS[dialect].defaults)).toMatchObject({
      ok: true,
      meaning: 'Every 5 minutes.',
    });
  }

  expect(
    convertFields('standard', 'quartz', { ...weekdays, dayOfWeek: '6-7' })
      .dayOfWeek,
  ).toBe('7-1');
  expect(
    convertFields('quartz', 'standard', { ...quartz, dayOfWeek: '7-1' })
      .dayOfWeek,
  ).toBe('6-7');
});
