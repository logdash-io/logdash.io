<script lang="ts">
  import { useCases } from '$lib/landing/seo/families/use-cases.data';
  import SeoHubLayout from '$lib/landing/seo/SeoHubLayout.svelte';
</script>

<SeoHubLayout family={useCases.family} pages={useCases.pages} />
