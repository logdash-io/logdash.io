<script lang="ts">
  import { statusPages } from '$lib/landing/seo/families/status-page.data';
  import SeoHubLayout from '$lib/landing/seo/SeoHubLayout.svelte';
</script>

<SeoHubLayout family={statusPages.family} pages={statusPages.pages} />
