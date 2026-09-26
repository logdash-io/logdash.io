import { PublicDashboardBadgeService } from '@logdash/hyper-ui/features/public-dashboard/services/index';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request }) =>
  PublicDashboardBadgeService.fetchBadge(
    params.public_dashboard_id,
    params.badge_key,
    request,
  );
