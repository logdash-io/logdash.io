<script lang="ts">
  import { platforms } from '$lib/landing/seo/families/monitor.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout
  family={platforms.family}
  pages={platforms.pages}
  page={data.page}
/>
