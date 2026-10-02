import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

export const statusPagesFamily: SeoFamily = {
  key: 'status-page',
  hubPath: '/status-page',
  hubLabel: 'All status page guides',
  title: 'TODO | Logdash',
  description: 'TODO',
  intro: 'TODO',
};

export const statusPagesPages: SeoPage[] = [];

export const statusPages: SeoFamilyData = {
  family: statusPagesFamily,
  pages: statusPagesPages,
};
