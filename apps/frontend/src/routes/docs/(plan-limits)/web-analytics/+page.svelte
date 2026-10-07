<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoMeta
  title="Web analytics | Logdash Docs"
  description={docPages.webAnalytics.description}
  keywords="cookieless analytics, custom events, event properties, website analytics script, first-party analytics proxy"
/>

<DocArticle page={docPages.webAnalytics} tables={data.tables} />
