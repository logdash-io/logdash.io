<script lang="ts">
  import { resolve } from '$app/paths';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoMeta
  title="Web analytics privacy | Logdash Docs"
  description={docPages.webAnalyticsPrivacy.description}
  keywords="cookieless analytics, analytics without cookies, web analytics privacy, data processing agreement"
/>

<DocArticle page={docPages.webAnalyticsPrivacy} tables={data.tables} />

<p class="mt-5 w-full max-w-2xl text-[15px] leading-7">
  <a
    href={resolve('/dpa')}
    class="text-fg-secondary hover:text-fg-default underline underline-offset-2 transition-ink duration-150"
  >
    Read the data processing agreement
  </a>
</p>
