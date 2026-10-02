import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

export const platformsFamily: SeoFamily = {
  key: 'monitor',
  hubPath: '/monitor',
  hubLabel: 'All platforms',
  title: 'TODO | Logdash',
  description: 'TODO',
  intro: 'TODO',
};

export const platformsPages: SeoPage[] = [];

export const platforms: SeoFamilyData = {
  family: platformsFamily,
  pages: platformsPages,
};
