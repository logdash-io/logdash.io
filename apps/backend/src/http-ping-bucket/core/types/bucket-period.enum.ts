import { BucketGranularity } from './bucket-granularity.enum';

export enum BucketsPeriod {
  Day = '24h',
  FourDays = '4d',
  NinetyHours = '90h',
  NinetyDays = '90d',
}

export const PeriodsGranularity: Record<BucketsPeriod, BucketGranularity> = {
  [BucketsPeriod.Day]: BucketGranularity.Hour,
  [BucketsPeriod.FourDays]: BucketGranularity.Hour,
  [BucketsPeriod.NinetyHours]: BucketGranularity.Hour,
  [BucketsPeriod.NinetyDays]: BucketGranularity.Day,
};
