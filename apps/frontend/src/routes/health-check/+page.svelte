<script lang="ts">
  import { healthCheck } from '$lib/landing/seo/families/health-check.data';
  import SeoHubLayout from '$lib/landing/seo/SeoHubLayout.svelte';
</script>

<SeoHubLayout family={healthCheck.family} pages={healthCheck.pages} />
