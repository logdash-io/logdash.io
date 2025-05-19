import { Injectable } from '@nestjs/common';
import { RecordMetricDto } from '../ingestion/dto/record-metric.dto';
import { MetricOperation } from '../core/enums/metric-operation.enum';

/* 
Whole point of this service is to aggregate similar DTOs received from the controller into a single DTO.
When you think about metrics, if user wants to increase metric 3 times by 1, it's the same as if they wanted to increase it by 3.
Apart from that, if user at some point wants to 'set' metric to 10, it's the same as if they wanted to set it to 10 right from the beginning.

It combines similar DTOs when they mutate the metric and it overrides previous DTOs if they set absolute value.
Every series of DTOs related to the same metric is aggregated into a single DTO.
*/

@Injectable()
export class MetricAggregationService {
  private metricsMap: Record<string, RecordMetricDto> = {};

  public save(dto: RecordMetricDto): void {
    const { name, projectId } = dto;

    const key = `${name}-${projectId}`;

    if (!this.metricsMap[key]) {
      this.metricsMap[key] = dto;
    } else {
      const existingDto = this.metricsMap[key];

      if (dto.operation === MetricOperation.Set) {
        this.metricsMap[key] = dto;
      } else {
        this.metricsMap[key] = {
          ...existingDto,
          value: existingDto.value + dto.value,
        };
      }
    }
  }

  public getAndClear(): RecordMetricDto[] {
    const metrics = Object.values(this.metricsMap);

    this.metricsMap = {};

    return metrics;
  }
}
