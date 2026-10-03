<script lang="ts">
  import { learn } from '$lib/landing/seo/families/learn.data';
  import SeoPageLayout from '$lib/landing/seo/SeoPageLayout.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<SeoPageLayout family={learn.family} pages={learn.pages} page={data.page} />
