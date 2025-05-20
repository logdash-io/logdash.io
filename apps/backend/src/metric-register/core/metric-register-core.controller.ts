import {
  Controller,
  Delete,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MetricRegisterWriteService } from '../write/metric-register-write.service';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { SuccessResponse } from '../../shared/responses/success.response';
import { MetricWriteService } from '../../metric/write/metric-write.service';

@Controller('')
@ApiTags('Metric Register')
@ApiBearerAuth()
export class MetricRegisterCoreController {
  constructor(
    private readonly metricRegisterWriteService: MetricRegisterWriteService,
    private readonly metricWriteService: MetricWriteService,
  ) {}

  @Delete('projects/:projectId/metric-register/:id')
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: SuccessResponse })
  public async removeMetricRegisterEntry(
    @Param('id') id: string,
  ): Promise<SuccessResponse> {
    const entryId = await this.metricRegisterWriteService.removeById({
      id,
    });

    if (!entryId) {
      throw new NotFoundException('Metric register entry not found');
    }

    await this.metricWriteService.deleteByMetricRegisterEntryId(entryId);

    return new SuccessResponse();
  }
}
