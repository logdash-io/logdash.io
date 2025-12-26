<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import MigrationGuide from '$lib/landing/guides/MigrationGuide.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
</script>

<SeoMeta
  title="Migrate from @logdash/js-sdk to @logdash/node | Logdash"
  description="Step-by-step guide to migrate your codebase from @logdash/js-sdk to the new @logdash/node package. Includes an AI-powered migration prompt."
  keywords="logdash migration, js-sdk to node, sdk migration guide, logdash upgrade"
/>

<AnimatedView class="mx-auto w-full">
  <div class="mx-auto max-w-3xl">
    <MigrationGuide />
  </div>
  <Footer />
</AnimatedView>
