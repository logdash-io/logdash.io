<script lang="ts">
  import { healthCheck } from '$lib/landing/seo/families/health-check.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout
  family={healthCheck.family}
  pages={healthCheck.pages}
  page={data.page}
/>
