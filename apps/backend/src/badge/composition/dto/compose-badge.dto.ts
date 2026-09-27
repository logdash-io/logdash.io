import { BadgePeriod } from '../../core/enums/badge-period.enum';
import { BadgeStyle } from '../../core/enums/badge-style.enum';
import { BadgeTheme } from '../../core/enums/badge-theme.enum';

export class ComposeBadgeDto {
  publicDashboardIdOrDomain: string;
  badgeKey: string;
  style: BadgeStyle;
  period: BadgePeriod;
  theme: BadgeTheme;
}
