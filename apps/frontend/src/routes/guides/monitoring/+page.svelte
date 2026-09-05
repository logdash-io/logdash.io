<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoMeta
  title="Monitoring | Logdash Guides"
  description="Monitor your services with HTTP health checks, uptime tracking, and public status pages with Logdash."
  keywords="logdash monitoring, uptime monitoring, health checks, status pages"
/>

<DocArticle page={docPages.monitoring} tables={data.tables} />
