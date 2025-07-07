import { LogAnalyticsService } from '$lib/domains/logs/infrastructure/log-analytics.service';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const utcOffsetHours = url.searchParams.get('utcOffsetHours');

  if (!startDate || !endDate) {
    return json(
      { error: 'startDate and endDate are required' },
      { status: 400 },
    );
  }

  try {
    const analytics = await LogAnalyticsService.getProjectLogsAnalytics(
      params.project_id,
      startDate,
      endDate,
      utcOffsetHours ? parseInt(utcOffsetHours) : undefined,
    );

    return json({
      status: 200,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching logs analytics:', error);
    return json({ error: 'Failed to fetch logs analytics' }, { status: 500 });
  }
};
