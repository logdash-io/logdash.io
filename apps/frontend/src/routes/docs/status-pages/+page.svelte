<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import { docPages } from '$lib/landing/guides/documentation.data';

  const REPOSITORY_URL = 'https://github.com/logdash-io/logdash.io/tree/main';
</script>

<SeoMeta
  title="Build your own status page | Logdash Docs"
  description={docPages.statusPages.description}
  keywords="status page api, headless status page, custom status page, status page react, status page svelte, nextjs status page"
  canonical="/docs/status-pages"
/>

<DocArticle page={docPages.statusPages} />

<footer class="mt-10 w-full max-w-2xl">
  <p class="text-neutral-500 text-sm leading-6">
    The starter and the client library are open source, in
    <!-- eslint-disable svelte/no-navigation-without-resolve -- source lives on GitHub -->
    <a
      href="{REPOSITORY_URL}/templates/status-page-next"
      target="_blank"
      rel="noopener noreferrer"
      class="text-neutral-400 hover:text-fg-default underline underline-offset-2 transition-ink duration-150"
    >
      templates/status-page-next
    </a>
    and
    <a
      href="{REPOSITORY_URL}/packages/status"
      target="_blank"
      rel="noopener noreferrer"
      class="text-neutral-400 hover:text-fg-default underline underline-offset-2 transition-ink duration-150"
    >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
      packages/status
    </a>
    of the Logdash repository.
  </p>
</footer>
