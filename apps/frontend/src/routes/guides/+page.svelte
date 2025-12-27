<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import DocumentationContent from '$lib/landing/guides/DocumentationContent.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
</script>

<SeoMeta
  title="Guides | Logdash"
  description="Step-by-step tutorials and migration guides to help you integrate and get the most out of Logdash."
  keywords="logdash guides, migration guide, sdk migration, integration tutorial"
/>

<AnimatedView class="mx-auto w-full">
  <div class="mx-auto max-w-3xl">
    <DocumentationContent />
  </div>
  <Footer />
</AnimatedView>
