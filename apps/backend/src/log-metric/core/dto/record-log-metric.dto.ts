import { LogLevel } from '../../../log/core/enums/log-level.enum';
import { PartialRecord } from '../../../shared/types/partial-record.type';

export class RecordLogMetricDto {
  date: Date;
  values: PartialRecord<LogLevel, number>;
  projectId: string;
}
