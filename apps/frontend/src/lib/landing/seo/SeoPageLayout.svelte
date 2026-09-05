<script lang="ts">
  import { resolve } from '$app/paths';
  import type { RouteId } from '$app/types';
  import { FEATURES } from '$lib/domains/shared/constants/features';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import DocArticle from '$lib/landing/guides/DocArticle.svelte';
  import type { DocPage } from '$lib/landing/guides/documentation.data';
  import HeroUrlForm from '$lib/landing/hero/HeroUrlForm.svelte';
  import { pagePath, siblings, type SeoFamily, type SeoPage } from './seo-page';

  type Props = {
    family: SeoFamily;
    pages: SeoPage[];
    page: SeoPage;
  };

  const { family, pages, page }: Props = $props();

  /**
   * Every family route is `<hub>/[slug]`, so one shape covers all of them.
   * `resolve` narrows to a single route at a time and cannot take a union, so
   * both hub and slug links go in under a cast. The values are real routes;
   * only the overload is too narrow to say so.
   */
  type SlugRoute = Extract<RouteId, `${string}/[slug]`>;

  const path = $derived(pagePath(family, page));

  const feature = $derived(
    FEATURES.find((entry) => `/features/${entry.slug}` === page.featurePath),
  );

  /**
   * DocArticle owns the article header, so the H1 and the answer line are fed
   * through it rather than written here; rendering them twice would put a
   * second H1 on the page. `path` is a docs field DocArticle never reads, and
   * the docs union cannot describe an SEO route, so the real path goes in
   * under a cast instead of a placeholder that is simply untrue.
   */
  const article = $derived<DocPage>({
    path: path as DocPage['path'],
    title: page.h1,
    description: page.answer,
    blocks: [...page.blocks, { type: 'faq', items: page.faq }],
  });

  /**
   * The entire internal link budget: the hub, three siblings and one feature.
   * A page that links everywhere reads as a page about nothing, so the cap
   * lives here rather than growing one family at a time.
   */
  const links = $derived([
    {
      href: resolve(family.hubPath as '/'),
      title: family.hubLabel,
      description: family.intro,
    },
    ...siblings(pages, page).map((sibling) => ({
      href: resolve(`${family.hubPath}/[slug]` as SlugRoute, {
        slug: sibling.slug,
      }),
      title: sibling.h1,
      description: sibling.answer,
    })),
    ...(feature
      ? [
          {
            href: resolve(page.featurePath),
            title: feature.title,
            description: feature.description,
          },
        ]
      : []),
  ]);
</script>

<SeoMeta
  title={page.meta.title}
  description={page.meta.description}
  canonical={path}
  type="article"
/>

<!--
  One column of prose under the global nav, the same document shape the docs
  use. Nothing below renders from client state, because the whole family is
  prerendered and a crawler only ever sees the HTML.
-->
<div class="w-full">
  <main
    class="mx-auto flex w-full max-w-2xl flex-col px-4 py-12 sm:px-6 lg:py-16"
  >
    <DocArticle page={article} />

    <!--
      The article always ends on the FAQ block's own hairline, so the CTA
      leans on space rather than adding a second rule right under the first.
    -->
    <section class="mt-12 flex flex-col gap-4">
      <h2 class="text-[15px] font-medium">
        Point it at your own URL and watch it for real.
      </h2>
      <div class="w-full max-w-md">
        <HeroUrlForm source="seo" compact />
      </div>
    </section>

    <nav aria-label="Keep reading" class="mt-14 flex flex-col gap-3">
      <h2 class="text-neutral-500 text-sm font-medium">Keep reading</h2>
      <div class="border-hairline divide-hairline divide-y border-y">
        <!-- eslint-disable svelte/no-navigation-without-resolve -- every href is built with resolve() above -->
        {#each links as link (link.href)}
          <a href={link.href} class="group flex items-center gap-4 py-4">
            <span class="flex min-w-0 flex-col gap-0.5">
              <span class="text-[15px] font-medium">{link.title}</span>
              <span
                class="text-neutral-400 group-hover:text-neutral-300 line-clamp-1 text-sm transition-ink duration-150"
              >
                {link.description}
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
  </main>

  <div class="border-hairline w-full border-t">
    <Footer />
  </div>
</div>
