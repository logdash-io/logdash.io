<script lang="ts">
  import { assets } from '$lib/landing/seo/families/monitoring.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout family={assets.family} pages={assets.pages} page={data.page} />
