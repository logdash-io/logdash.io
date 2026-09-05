<script lang="ts">
  import { resolve } from '$app/paths';
  import type { RouteId } from '$app/types';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import HeroUrlForm from '$lib/landing/hero/HeroUrlForm.svelte';
  import type { DocPage } from '$lib/landing/guides/documentation.data';
  import type { SeoFamily, SeoPage } from './seo-page';

  type Props = {
    family: SeoFamily;
    pages: SeoPage[];
  };

  const { family, pages }: Props = $props();

  /** Every family route is `<hub>/[slug]`, so one shape covers all of them. */
  type SlugRoute = Extract<RouteId, `${string}/[slug]`>;

  const hub = $derived(family.hub);

  /**
   * A hub that targets its own query carries an article; the rest get the
   * plain heading. The title is a meta title, so the suffix comes off before
   * it is used as an H1.
   */
  const heading = $derived(family.title.replace(/\s*\|\s*Logdash$/, ''));

  /** Same cast as the page layout: DocArticle never reads `path`. */
  const article = $derived<DocPage | null>(
    hub
      ? {
          path: family.hubPath as DocPage['path'],
          title: hub.h1,
          description: hub.answer,
          blocks: hub.faq
            ? [...hub.blocks, { type: 'faq', items: hub.faq }]
            : hub.blocks,
        }
      : null,
  );

  const entries = $derived(
    pages.map((page) => ({
      href: resolve(`${family.hubPath}/[slug]` as SlugRoute, {
        slug: page.slug,
      }),
      title: page.h1,
      description: page.answer,
    })),
  );
</script>

<SeoMeta
  title={hub?.meta.title ?? family.title}
  description={hub?.meta.description ?? family.description}
  canonical={family.hubPath}
/>

<!--
  The hub is the index for the family: one heading, one line of context and
  every page in the family, in data order so the link graph is stable.
-->
<div class="w-full">
  <main
    class="mx-auto flex w-full max-w-2xl flex-col px-4 py-12 sm:px-6 lg:py-16"
  >
    {#if article}
      <DocArticle page={article} />
    {:else}
      <header class="flex flex-col gap-3">
        <h1 class="text-4xl font-medium tracking-[-0.03em]">{heading}</h1>
        <p class="text-neutral-400 text-lg leading-7">{family.intro}</p>
      </header>
    {/if}

    {#if article}
      <!--
        A hub that answers its own query is the highest-intent page in the
        family, and without this it dead-ends into a link list while every
        leaf page offers a monitor. Same CTA as the page layout, same place.
      -->
      <section class="mt-12 flex flex-col gap-4">
        <h2 class="text-[15px] font-medium">
          Point it at your own URL and watch it for real.
        </h2>
        <div class="w-full max-w-md">
          <HeroUrlForm source="seo" compact />
        </div>
      </section>
    {/if}

    {#if entries.length > 0}
      <!--
        When the hub carries an article it ends on the FAQ's own hairline, and
        an unlabelled second hairline list right under it reads as more of the
        same block. The heading names the list as its own object, the way the
        page layout labels "Keep reading". A hub that is only a list needs no
        second label, because the H1 and the intro above already are one.
      -->
      <nav
        aria-label={family.hubLabel}
        class={['flex flex-col gap-3', article ? 'mt-14' : 'mt-12']}
      >
        {#if article}
          <h2 class="text-neutral-500 text-sm font-medium">
            {family.hubLabel}
          </h2>
        {/if}
        <div class="border-hairline divide-hairline divide-y border-y">
          <!-- eslint-disable svelte/no-navigation-without-resolve -- every href is built with resolve() above -->
          {#each entries as entry (entry.href)}
            <a href={entry.href} class="group flex items-center gap-4 py-4">
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="text-[15px] font-medium">{entry.title}</span>
                <span
                  class="text-neutral-400 group-hover:text-neutral-300 line-clamp-1 text-sm transition-ink duration-150"
                >
                  {entry.description}
                </span>
              </span>
              <ChevronRightIcon
                class="text-neutral-600 group-hover:text-base-content ml-auto size-4 shrink-0 transition-ink duration-150"
              />
            </a>
          {/each}
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        </div>
      </nav>
    {/if}
  </main>

  <div class="border-hairline w-full border-t">
    <Footer />
  </div>
</div>
