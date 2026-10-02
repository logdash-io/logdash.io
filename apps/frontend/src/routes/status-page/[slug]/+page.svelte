<script lang="ts">
  import { statusPages } from '$lib/landing/seo/families/status-page.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout
  family={statusPages.family}
  pages={statusPages.pages}
  page={data.page}
/>
