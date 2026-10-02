import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

export const assetsFamily: SeoFamily = {
  key: 'monitoring',
  hubPath: '/monitoring',
  hubLabel: 'All monitoring guides',
  title: 'TODO | Logdash',
  description: 'TODO',
  intro: 'TODO',
};

export const assetsPages: SeoPage[] = [];

export const assets: SeoFamilyData = {
  family: assetsFamily,
  pages: assetsPages,
};
