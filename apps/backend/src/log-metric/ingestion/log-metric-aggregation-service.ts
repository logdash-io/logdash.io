import { Injectable } from '@nestjs/common';
import { UpsertLogMetricDto } from '../write/dto/upsert-log-metric.dto';

/*

This service finds log metrics which belong to the same project, granularity and time bucket
and aggregates them into single log metric to reduce number of update to the database.
So if someone uploads 10x error and 10x warning, instead of 20 updates, it will be 1 update.

*/

@Injectable()
export class LogMetricAggregationService {
  public aggregate(dtos: UpsertLogMetricDto[]): UpsertLogMetricDto[] {
    const aggregatedDtos: Record<string, UpsertLogMetricDto> = {};

    for (const dto of dtos) {
      const key = `${dto.projectId}-${dto.granularity}-${dto.timeBucket}`;

      const { values, ...dtoWithoutValues } = dto;

      if (!aggregatedDtos[key]) {
        aggregatedDtos[key] = { ...dtoWithoutValues, values: {} };
      }

      for (const level in values) {
        if (!aggregatedDtos[key].values[level]) {
          aggregatedDtos[key].values[level] = 0;
        }

        aggregatedDtos[key].values[level] += values[level];
      }
    }

    return Object.values(aggregatedDtos);
  }
}
