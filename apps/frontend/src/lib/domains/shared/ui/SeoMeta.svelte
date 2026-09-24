<script lang="ts">
  import { page } from '$app/state';
  import { markdownPath } from '$lib/landing/seo/markdown-twin';

  type JsonLd = Record<string, unknown>;

  type Props = {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    type?: 'website' | 'article';
    canonical?: string;
    robots?: 'noindex' | 'noindex, nofollow';
    jsonLd?: JsonLd | JsonLd[];
    /** Links the page's markdown twin. Only sitemap pages have one. */
    markdownTwin?: boolean;
  };

  let {
    title,
    description,
    keywords = 'log monitoring, server monitoring, uptime monitoring, saas health, devops tools',
    image = '/og.png',
    type = 'website',
    canonical,
    robots,
    jsonLd,
    markdownTwin = !robots,
  }: Props = $props();

  const baseUrl = 'https://logdash.io';

  // Accepts a root-relative path or a full URL, and re-roots either onto the canonical host.
  const absolute = (pathOrUrl: string) => {
    const { pathname, search } = new URL(pathOrUrl, baseUrl);
    return `${baseUrl}${pathname}${search}`;
  };

  const canonicalUrl = $derived(absolute(canonical ?? page.url.pathname));
  const markdownUrl = $derived(
    `${baseUrl}${markdownPath(new URL(canonicalUrl).pathname)}`,
  );
  const imageUrl = $derived(`${baseUrl}${image}`);
  const logoUrl = `${baseUrl}/logo.png`;

  const jsonLdEntries = $derived(
    jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [],
  );

  // Svelte ends this block at the first literal closing tag, so that tag is assembled instead.
  const closingTag = '</' + 'script>';

  // Escaping `<` stops a closing tag inside any string value from breaking out of the payload.
  const jsonLdScript = (entry: JsonLd) =>
    `<script type="application/ld+json">${JSON.stringify(entry).replace(/</g, '\\u003C')}${closingTag}`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords} />
  {#if robots}
    <meta name="robots" content={robots} />
  {/if}
  <link rel="canonical" href={canonicalUrl} />
  {#if markdownTwin}
    <!-- The page as markdown, for LLMs and coding agents. -->
    <link rel="alternate" type="text/markdown" href={markdownUrl} />
  {/if}

  <!-- Open Graph / Facebook -->
  <meta property="og:logo" content={logoUrl} />
  <meta property="og:type" content={type} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={imageUrl} />
  <meta property="og:site_name" content="Logdash" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={canonicalUrl} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={imageUrl} />

  {#each jsonLdEntries as entry, i (i)}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- serialised JSON-LD, escaped above -->
    {@html jsonLdScript(entry)}
  {/each}
</svelte:head>
