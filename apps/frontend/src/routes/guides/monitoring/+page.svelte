<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import DocumentationContent from '$lib/landing/guides/DocumentationContent.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
</script>

<SeoMeta
  title="Monitoring | Logdash Guides"
  description="Monitor your services with HTTP health checks, uptime tracking, and public status pages with Logdash."
  keywords="logdash monitoring, uptime monitoring, health checks, status pages"
/>

<AnimatedView class="mx-auto w-full">
  <div class="mx-auto max-w-3xl">
    <DocumentationContent />
  </div>
  <Footer />
</AnimatedView>
