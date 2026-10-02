<script lang="ts">
  import { useCases } from '$lib/landing/seo/families/use-cases.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout
  family={useCases.family}
  pages={useCases.pages}
  page={data.page}
/>
