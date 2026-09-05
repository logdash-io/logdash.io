<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import {
    selfHostingIssueUrl,
    selfHostingPage,
  } from '$lib/landing/docs/self-hosting.data';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
</script>

<SeoMeta
  title="Self-host Logdash | Logdash Docs"
  description={selfHostingPage.description}
  keywords="self-host logdash, logdash open source, logdash docker, run logdash locally, mit licensed monitoring"
  canonical="/docs/self-hosting"
/>

<DocArticle page={selfHostingPage} />

<footer class="mt-10 w-full max-w-2xl">
  <p class="text-neutral-500 text-sm leading-6">
    Self-hosting progress is tracked in the open.
    <!-- eslint-disable svelte/no-navigation-without-resolve -- issue tracker lives on GitHub -->
    <a
      href={selfHostingIssueUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="text-neutral-400 hover:text-base-content underline underline-offset-2 transition-ink duration-150"
    >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
      Follow the issues on GitHub
    </a>
    to see where it stands.
  </p>
</footer>
