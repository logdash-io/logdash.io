<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';
</script>

<SeoMeta
  title="Docs | Logdash"
  description="Set up Logdash logging, metrics and uptime monitoring, read the plan limits and pick one of the eight official SDKs."
  keywords="logdash docs, logdash documentation, getting started, logging, metrics, monitoring, sdk"
/>

<DocArticle page={docPages.introduction} />
