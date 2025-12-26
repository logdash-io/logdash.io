<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Use Cases | Logdash"
  description="Discover how developers use Logdash to monitor their applications and track business metrics."
  keywords="logdash use cases, monitoring examples, logging use cases"
/>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-24 sm:px-8">
    <div class="text-center">
      <h1 class="mb-4 text-4xl font-bold">Use Cases</h1>
      <p class="text-base-content/70 mx-auto max-w-2xl text-lg">
        Coming soon. We're working on documenting real-world use cases to help
        you get the most out of Logdash.
      </p>
    </div>
  </div>

  <Footer />
</AnimatedView>
