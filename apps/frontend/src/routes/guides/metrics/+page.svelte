<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoMeta
  title="Metrics | Logdash Guides"
  description="Track custom metrics from your application to monitor key business indicators with Logdash."
  keywords="logdash metrics, custom metrics, business metrics, metrics tracking"
/>

<DocArticle page={docPages.metrics} tables={data.tables} />
