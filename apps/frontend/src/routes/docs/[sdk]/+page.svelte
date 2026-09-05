<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();

  const shortSha = $derived(data.doc.sourceRef.sha.slice(0, 7));
</script>

<SeoMeta
  title="Logdash {data.doc.name} SDK"
  description={data.page.description}
  keywords="logdash {data.doc.name} sdk, {data.doc.name} logging, {data.doc
    .name} metrics, {data.doc.name} monitoring"
  canonical="/docs/{data.doc.slug}"
/>

<DocArticle page={data.page} />

<!--
  The snippets are copies, so the page names the commit they were copied from
  and a reader can diff it against whatever upstream looks like today.
-->
<footer class="mt-10 w-full max-w-2xl">
  <p class="text-neutral-500 text-sm leading-6">
    Copied from the
    <!-- eslint-disable svelte/no-navigation-without-resolve -- pinned upstream README -->
    <a
      href={data.doc.sourceRef.url}
      target="_blank"
      rel="noopener noreferrer"
      class="text-neutral-400 hover:text-base-content underline underline-offset-2 transition-ink duration-150"
    >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
      {data.doc.repo} README at {shortSha}
    </a>
    on {data.doc.updatedAt}.
  </p>
</footer>
