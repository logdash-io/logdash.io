<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoMeta
  title="Guides | Logdash"
  description="Step-by-step tutorials and migration guides to help you integrate and get the most out of Logdash."
  keywords="logdash guides, migration guide, sdk migration, integration tutorial"
/>

<DocArticle page={docPages.introduction} tables={data.tables} />
