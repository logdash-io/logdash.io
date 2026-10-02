import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

export const cronMonitoringFamily: SeoFamily = {
  key: 'cron-monitoring',
  hubPath: '/cron-monitoring',
  hubLabel: 'All cron monitoring guides',
  title: 'TODO | Logdash',
  description: 'TODO',
  intro: 'TODO',
};

export const cronMonitoringPages: SeoPage[] = [];

export const cronMonitoring: SeoFamilyData = {
  family: cronMonitoringFamily,
  pages: cronMonitoringPages,
};
