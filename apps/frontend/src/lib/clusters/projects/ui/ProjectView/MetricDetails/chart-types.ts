export enum ChartType {
  MINUTE = 'MINUTE',
  HOUR = 'HOUR',
  DAY = 'DAY',
}

export const ChartOptions = {
  [ChartType.MINUTE]: {
    SMALL: '1h',
    LARGE: '12h',
  },
  [ChartType.HOUR]: {
    SMALL: '24h',
    LARGE: '7 days',
  },
  [ChartType.DAY]: {
    SMALL: '7 days',
    LARGE: '30 days',
  },
} as const;

export const ChartTitles = {
  [ChartType.MINUTE]: 'Minute data',
  [ChartType.HOUR]: 'Hour data',
  [ChartType.DAY]: 'Day data',
} as const;
