import type {
  CodeLanguage,
  DocFaqItem,
  DocsPath,
} from '$lib/landing/guides/documentation.data';
import type { NavPath } from '$lib/landing/nav/nav.data';
import { SITE_ORIGIN } from '$lib/landing/seo/seo-routes';

export type FeatureSlug = 'monitoring' | 'logging' | 'metrics';

export type FeatureCopy = { title: string; body: string };

export type FeatureLink = {
  title: string;
  description: string;
  href: Exclude<DocsPath, `/docs/sdks/${string}`> | NavPath;
};

export type FeaturePageData = {
  slug: FeatureSlug;
  name: string;
  meta: { title: string; description: string; keywords: string };
  h1: string;
  h1Quiet: string;
  intro: string;
  overview: { title: string; quiet: string; description: string };
  capabilities: FeatureCopy[];
  steps: { title: string; description: string; items: FeatureCopy[] };
  sdk?: FeatureCopy & { language: CodeLanguage; code: string; file: string };
  faq: DocFaqItem[];
  related: FeatureLink[];
};

export function featurePath(slug: FeatureSlug): `/features/${FeatureSlug}` {
  return `/features/${slug}`;
}

export function featureJsonLd(
  page: FeaturePageData,
): Record<string, unknown>[] {
  const url = `${SITE_ORIGIN}${featurePath(page.slug)}`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `Logdash ${page.name}`,
      url,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description: page.meta.description,
      featureList: page.capabilities.map((capability) => capability.title),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_ORIGIN}/`,
        },
        { '@type': 'ListItem', position: 2, name: page.name, item: url },
      ],
    },
  ];
}
