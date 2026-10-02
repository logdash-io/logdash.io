<script lang="ts">
  import { tools } from '$lib/landing/seo/families/tools.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout family={tools.family} pages={tools.pages} page={data.page} />
