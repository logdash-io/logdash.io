import {
  GOALS_COOKIE,
  parseGoals,
} from '$lib/domains/web-analytics/domain/day-analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => ({
  goals: parseGoals(cookies.get(GOALS_COOKIE)),
});
