import type { SimplifiedMetric } from './metric.js';

export const FAKE_METRICS: SimplifiedMetric[] = [
  {
    id: 'fake-users',
    metricRegisterEntryId: 'fake-users-register',
    name: 'Active Users',
    value: 2847,
  },
  {
    id: 'fake-requests',
    metricRegisterEntryId: 'fake-requests-register',
    name: 'API Requests',
    value: 156429,
  },
  {
    id: 'fake-errors',
    metricRegisterEntryId: 'fake-errors-register',
    name: 'Error Rate',
    value: 0.3,
  },
];

export type FakeDataPoint = {
  x: string;
  y: number;
};

function generateTimeLabels(
  count: number,
  format: 'minute' | 'hour' | 'day',
): string[] {
  const labels: string[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);

    if (format === 'minute') {
      date.setMinutes(date.getMinutes() - i);
      labels.push(
        `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      );
    } else if (format === 'hour') {
      date.setHours(date.getHours() - i);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      labels.push(`${day}/${month} ${hour}:00`);
    } else {
      date.setDate(date.getDate() - i);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      labels.push(`${day}/${month}`);
    }
  }

  return labels;
}

function generateSmoothCurve(
  count: number,
  baseValue: number,
  variance: number,
): number[] {
  const values: number[] = [];
  let current = baseValue;

  for (let i = 0; i < count; i++) {
    const trend = Math.sin((i / count) * Math.PI * 2) * (variance * 0.3);
    const noise = (Math.random() - 0.5) * variance * 0.4;
    current = baseValue + trend + noise;
    current = Math.max(0, current);
    values.push(Math.round(current * 10) / 10);
  }

  return values;
}

export function generateFakeMinuteData(): FakeDataPoint[] {
  const labels = generateTimeLabels(60, 'minute');
  const values = generateSmoothCurve(60, 150, 80);

  return labels.map((label, i) => ({
    x: label,
    y: values[i],
  }));
}

export function generateFakeHourData(): FakeDataPoint[] {
  const labels = generateTimeLabels(12, 'hour');
  const values = generateSmoothCurve(12, 2500, 1200);

  return labels.map((label, i) => ({
    x: label,
    y: values[i],
  }));
}

export function generateFakeDayData(): FakeDataPoint[] {
  const labels = generateTimeLabels(7, 'day');
  const values = generateSmoothCurve(7, 45000, 15000);

  return labels.map((label, i) => ({
    x: label,
    y: values[i],
  }));
}
