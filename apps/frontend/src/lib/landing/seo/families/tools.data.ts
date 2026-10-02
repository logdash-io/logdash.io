import type { SeoFamily, SeoFamilyData, SeoPage } from '../seo-page';

export const toolsFamily: SeoFamily = {
  key: 'tools',
  hubPath: '/tools',
  hubLabel: 'All free tools',
  title: 'TODO | Logdash',
  description: 'TODO',
  intro: 'TODO',
};

export const toolsPages: SeoPage[] = [];

export const tools: SeoFamilyData = {
  family: toolsFamily,
  pages: toolsPages,
};
