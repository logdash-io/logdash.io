<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocsPage from '$lib/landing/guides/DocsPage.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoMeta
  title={data.page.metaTitle ?? `${data.page.title} | Logdash Docs`}
  description={data.page.description}
  keywords={data.page.keywords}
  canonical={data.page.path}
/>

<DocsPage page={data.page} exposedConfig={data.exposedConfig} />
