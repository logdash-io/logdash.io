<script lang="ts">
  import { alternatives } from '$lib/landing/seo/families/alternatives.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout
  family={alternatives.family}
  pages={alternatives.pages}
  page={data.page}
/>
