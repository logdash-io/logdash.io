<script lang="ts">
  import { page } from '$app/state';
  import { addressFromPath } from '$lib/domains/anonymous/application/preview-address';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import LandingPage from '$lib/landing/LandingPage.svelte';

  const address = $derived(
    addressFromPath(page.url.pathname)?.replace(/^https?:\/\//i, ''),
  );
</script>

<SeoMeta
  title={address ? `${address} · Logdash` : 'Logdash'}
  description="Paste your URL and watch a live dashboard in 30 seconds, no account needed. Uptime monitoring, logs and metrics for SaaS founders."
  canonical="/"
  robots="noindex"
/>

<LandingPage />
