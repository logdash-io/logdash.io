import { Injectable } from '@nestjs/common';
import { PublicDashboardWriteService } from '../write/public-dashboard-write.service';
import { PublicDashboardReadService } from '../read/public-dashboard-read.service';

@Injectable()
export class PublicDashboardCoreService {
  constructor(
    private readonly publicDashboardWriteService: PublicDashboardWriteService,
    private readonly publicDashboardReadService: PublicDashboardReadService,
  ) {}
}
