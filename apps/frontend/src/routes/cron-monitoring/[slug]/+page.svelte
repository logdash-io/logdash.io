<script lang="ts">
  import { cronMonitoring } from '$lib/landing/seo/families/cron-monitoring.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout
  family={cronMonitoring.family}
  pages={cronMonitoring.pages}
  page={data.page}
/>
