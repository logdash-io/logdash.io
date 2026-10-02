<script lang="ts">
  import { alerts } from '$lib/landing/seo/families/alerts.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout family={alerts.family} pages={alerts.pages} page={data.page} />
