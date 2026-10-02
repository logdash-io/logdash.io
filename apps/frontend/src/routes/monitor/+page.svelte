<script lang="ts">
  import { platforms } from '$lib/landing/seo/families/monitor.data';
  import SeoHubLayout from '$lib/landing/seo/SeoHubLayout.svelte';
</script>

<SeoHubLayout family={platforms.family} pages={platforms.pages} />
