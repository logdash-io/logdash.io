import { IsIn } from 'class-validator';

export class GetBucketsQuery {
  @IsIn(['24h', '4d', '90d'])
  period: '24h' | '4d' | '90d';
}
