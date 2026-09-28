<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import LandingPage from '$lib/landing/LandingPage.svelte';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Logdash',
    url: 'https://logdash.io',
    logo: 'https://logdash.io/logo.png',
    sameAs: ['https://x.com/logdash_io'],
    description:
      'Uptime monitoring, logs and metrics for SaaS founders. No account needed.',
  };
</script>

<SeoMeta
  title="Logdash - Uptime monitoring, logs and metrics for SaaS founders"
  description="Paste your URL and watch a live dashboard in 30 seconds, no account needed. Uptime monitoring, logs and metrics for SaaS founders."
  keywords="uptime monitoring, saas monitoring, solo founder tools, log management, server monitoring, logdash"
  {jsonLd}
/>

<LandingPage />
