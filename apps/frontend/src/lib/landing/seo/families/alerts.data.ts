import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

export const alertsFamily: SeoFamily = {
  key: 'alerts',
  hubPath: '/alerts',
  hubLabel: 'All alert channels',
  title: 'TODO | Logdash',
  description: 'TODO',
  intro: 'TODO',
};

export const alertsPages: SeoPage[] = [];

export const alerts: SeoFamilyData = {
  family: alertsFamily,
  pages: alertsPages,
};
