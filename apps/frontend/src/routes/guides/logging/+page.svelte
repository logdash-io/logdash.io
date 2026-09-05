<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoMeta
  title="Logging | Logdash Guides"
  description="Learn how to track system events and errors in real-time with Logdash logging. Understand retention policies and rate limits."
  keywords="logdash logging, log retention, rate limits, real-time logging"
/>

<DocArticle page={docPages.logging} tables={data.tables} />
