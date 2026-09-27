<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';
</script>

<SeoMeta
  title="Monitoring | Logdash Docs"
  description="Monitor your services with HTTP health checks, uptime tracking, and public status pages with Logdash."
  keywords="logdash monitoring, uptime monitoring, health checks, status pages"
/>

<DocArticle page={docPages.monitoring} />
