import { VirtualBucket } from '../../../http-ping-bucket/core/types/virtual-bucket.type';
import { MonitorStatus } from '../../../http-ping/core/enums/monitor-status.enum';
import { BadgeStyle } from '../../core/enums/badge-style.enum';
import { BadgeTheme } from '../../core/enums/badge-theme.enum';

export class RenderBadgeDto {
  style: BadgeStyle;
  theme: BadgeTheme;
  name: string;
  status: MonitorStatus;
  uptime: number | null;
  periodLabel: string;
  dailyBuckets: (VirtualBucket | null)[];
  isWhiteLabel: boolean;
}
