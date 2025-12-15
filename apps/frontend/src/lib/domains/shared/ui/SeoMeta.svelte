<script lang="ts">
  import { page } from '$app/state';

  type Props = {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    type?: 'website' | 'article';
    jsonLd?: Record<string, any>;
  };

  let {
    title,
    description,
    keywords = 'log monitoring, server monitoring, uptime monitoring, saas health, devops tools',
    image = '/og.png',
    type = 'website',
    jsonLd,
  }: Props = $props();

  const baseUrl = page.url.origin;
  const canonicalUrl = $derived(`${baseUrl}${page.url.pathname}`);
  const imageUrl = $derived(
    image.startsWith('http') ? image : `${baseUrl}${image}`,
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph / Facebook -->
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

  {#if jsonLd}
    {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
  {/if}
</svelte:head>
