<script lang="ts">
  import { resolve } from '$app/paths';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import LegalDocument from '$lib/domains/shared/ui/legal/LegalDocument.svelte';
  import type { LegalDocumentDefinition } from '$lib/domains/shared/ui/legal/LegalDocumentDefinition';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import DocsToc from '$lib/landing/guides/DocsToc.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';

  type Props = {
    definition: LegalDocumentDefinition;
    title: string;
    description: string;
    updated?: string;
  };
  const { definition, title, description, updated }: Props = $props();

  let article: HTMLElement | undefined = $state();
</script>

<SeoMeta title="{title} | Logdash" {description} />

<div class="flex w-full flex-col">
  <header
    class="mx-auto flex w-full max-w-landing flex-col items-start px-4 pt-12 pb-12 sm:px-6 lg:px-10 lg:pt-16 lg:pb-16"
  >
    <nav aria-label="Breadcrumb">
      <ol class="text-fg-muted flex items-center gap-2 text-sm">
        <li>
          <a
            href={resolve('/')}
            class="hover:text-fg-default transition-ink duration-150"
          >
            Home
          </a>
        </li>
        <li aria-hidden="true">
          <ChevronRightIcon class="text-fg-faint size-3.5" />
        </li>
        <li aria-current="page" class="text-fg-secondary">{title}</li>
      </ol>
    </nav>

    <h1
      class="mt-6 max-w-5xl text-[32px] leading-[1.04] font-medium tracking-[-0.03em] text-balance sm:text-[40px] lg:text-[56px]"
    >
      {title}
    </h1>

    <p class="text-fg-tertiary mt-6 max-w-2xl text-lg text-pretty sm:text-xl">
      {description}
    </p>
  </header>

  <LandingSection dividerTop>
    <div class="grid grid-cols-1 lg:grid-cols-5">
      <aside
        class="border-surface-root-border hidden border-r lg:col-span-2 lg:block"
      >
        <DocsToc container={article} />
      </aside>

      <article
        bind:this={article}
        class="min-w-0 px-4 py-10 sm:px-6 lg:col-span-3 lg:px-10"
      >
        <LegalDocument {definition} {updated} />
      </article>
    </div>
  </LandingSection>

  <LandingSection divider={false} class="h-12 lg:h-16" />

  <Footer />
</div>
