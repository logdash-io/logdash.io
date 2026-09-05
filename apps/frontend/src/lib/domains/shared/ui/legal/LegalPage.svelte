<script lang="ts">
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import LegalDocument from '$lib/domains/shared/ui/legal/LegalDocument.svelte';
  import type { LegalDocumentDefinition } from '$lib/domains/shared/ui/legal/LegalDocumentDefinition';
  import Footer from '$lib/landing/Footer.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';

  type Props = {
    definition: LegalDocumentDefinition;
    title: string;
    /** One sentence, so the page has a description in the sitemap listing. */
    description: string;
  };
  const { definition, title, description }: Props = $props();
</script>

<!--
  These three pages are in the sitemap, so they need the same head as every
  other indexable page. A bare <title> left them with no canonical and no
  description.
-->
<SeoMeta title="{title} | Logdash" {description} />

<div class="mx-auto flex w-full max-w-landing flex-col">
  <div class="py-16">
    <div class="ld-modal relative mx-auto flex max-w-4xl flex-col gap-4">
      <div class="flex items-center justify-center gap-4">
        <Logo class="h-14 w-14" />

        <h1 class="text-center text-2xl font-semibold lg:text-3xl">
          {title}
        </h1>
      </div>

      <LegalDocument {definition} />
    </div>
  </div>

  <Footer />
</div>
