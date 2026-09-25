<script lang="ts">
  import { resolve } from '$app/paths';
  import { FEATURES } from '$lib/domains/shared/constants/features';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import FakeLogSearch from '$lib/landing/FakeLogSearch.svelte';
  import FakeMetricsSparkline from '$lib/landing/FakeMetricsSparkline.svelte';
  import FakeUptimeChart from '$lib/landing/FakeUptimeChart.svelte';
  import FaqSection from '$lib/landing/FAQSection.svelte';
  import FinalCta from '$lib/landing/FinalCta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import FrameworksList from '$lib/landing/FrameworksList.svelte';
  import CodeBlock from '$lib/landing/guides/blocks/CodeBlock.svelte';
  import { HERO_ID } from '$lib/landing/hero/hero-anchors';
  import HeroUrlForm from '$lib/landing/hero/HeroUrlForm.svelte';
  import LandingHeading from '$lib/landing/LandingHeading.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';
  import StageLight from '$lib/landing/stage/StageLight.svelte';
  import StagePanel from '$lib/landing/stage/StagePanel.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';
  import {
    featureJsonLd,
    featurePath,
    type FeatureLink,
    type FeaturePageData,
  } from './feature-page';

  type Props = {
    page: FeaturePageData;
  };

  const { page }: Props = $props();

  const jsonLd = $derived(featureJsonLd(page));

  const links = $derived<FeatureLink[]>([
    ...FEATURES.filter((feature) => feature.slug !== page.slug).map(
      (feature) => ({
        title: feature.title,
        description: feature.description,
        href: featurePath(feature.slug),
      }),
    ),
    ...page.related,
  ]);
</script>

<SeoMeta
  title={page.meta.title}
  description={page.meta.description}
  keywords={page.meta.keywords}
  {jsonLd}
/>

<div class="flex w-full flex-col">
  <header
    class="mx-auto flex w-full max-w-landing flex-col items-start px-4 pt-12 pb-12 sm:px-6 lg:px-10 lg:pt-16 lg:pb-16"
  >
    <nav aria-label="Breadcrumb">
      <ol class="text-neutral-500 flex items-center gap-2 text-sm">
        <li>
          <a
            href={resolve('/')}
            class="hover:text-fg-default transition-ink duration-150"
          >
            Home
          </a>
        </li>
        <li aria-hidden="true">
          <ChevronRightIcon class="text-neutral-600 size-3.5" />
        </li>
        <li aria-current="page" class="text-neutral-300">{page.name}</li>
      </ol>
    </nav>

    <h1
      class="mt-6 max-w-5xl text-[32px] leading-[1.04] font-medium tracking-[-0.03em] text-balance sm:text-[40px] lg:text-[56px]"
    >
      {page.h1}
      <span class="text-neutral-600 block">{page.h1Quiet}</span>
    </h1>

    <p class="text-neutral-400 mt-6 max-w-2xl text-lg text-pretty sm:text-xl">
      {page.intro}
    </p>

    <div class="mt-8 w-full max-w-xl">
      <HeroUrlForm source="feature" />
    </div>

    <p class="text-neutral-600 mt-4 text-sm">
      No signup · No credit card ·
      <!-- eslint-disable svelte/no-navigation-without-resolve -- resolve() plus the hero hash -->
      <a
        href={`${resolve('/')}#${HERO_ID}`}
        class="text-neutral-400 hover:text-fg-default transition-ink duration-150"
        data-posthog-id={`feature-${page.slug}-demo-cta`}
      >
        See the live demo
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </p>
  </header>

  <LandingSection dividerTop>
    <div class="relative h-[26rem] overflow-hidden sm:h-[32rem]">
      <StageLight preset="bottom" class="absolute inset-0" />

      <StagePanel
        class="inset-x-4 top-10 bottom-0 mx-auto max-w-3xl rounded-t-xl sm:top-14"
        header={page.slug === 'logging' ? undefined : demoHeader}
      >
        {#if page.slug === 'logging'}
          <FakeLogSearch />
        {:else}
          <div class="flex h-full p-5">
            {#if page.slug === 'monitoring'}
              <FakeUptimeChart />
            {:else}
              <FakeMetricsSparkline />
            {/if}
          </div>
        {/if}
      </StagePanel>
    </div>
  </LandingSection>

  <LandingHeading
    title={page.overview.title}
    quiet={page.overview.quiet}
    description={page.overview.description}
  />

  <LandingSection>
    <ul
      class="bg-hairline grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
    >
      {#each page.capabilities as capability (capability.title)}
        <li class="bg-surface-root px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
          <h3 class="text-lg font-medium tracking-[-0.01em]">
            {capability.title}
          </h3>
          <p class="text-neutral-400 mt-2 leading-relaxed text-pretty">
            {capability.body}
          </p>
        </li>
      {/each}
    </ul>
  </LandingSection>

  <LandingHeading
    title={page.steps.title}
    description={page.steps.description}
  />

  <LandingSection>
    <ol class="bg-hairline grid grid-cols-1 gap-px lg:grid-cols-3">
      {#each page.steps.items as step, index (step.title)}
        <li class="bg-surface-root px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
          <!-- The <ol> already numbers the steps for screen readers. -->
          <span aria-hidden="true" class="text-neutral-600 font-mono text-sm">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 class="mt-4 text-lg font-medium tracking-[-0.01em]">
            {step.title}
          </h3>
          <p class="text-neutral-400 mt-2 leading-relaxed text-pretty">
            {step.body}
          </p>
        </li>
      {/each}
    </ol>
  </LandingSection>

  {#if page.sdk}
    <LandingSection>
      <div class="grid grid-cols-1 lg:grid-cols-12">
        <div
          class="border-hairline flex flex-col px-4 py-10 sm:px-6 lg:col-span-5 lg:border-r lg:px-10 lg:py-12"
        >
          <h2 class="text-2xl font-medium tracking-[-0.02em]">
            {page.sdk.title}
          </h2>

          <p class="text-neutral-400 mt-3 max-w-md leading-relaxed text-pretty">
            {page.sdk.body}
          </p>

          <a
            href={resolve('/docs/sdks')}
            class="text-fg-default hover:text-neutral-400 mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-ink duration-150"
            data-posthog-id={`feature-${page.slug}-sdk-docs`}
          >
            Browse all SDKs
            <ArrowRightIcon class="size-4" />
          </a>
        </div>

        <div
          class="border-hairline relative overflow-hidden border-t px-4 py-10 sm:px-6 lg:col-span-7 lg:border-t-0 lg:px-10 lg:py-12"
        >
          <StageLight preset="bottom-left" class="absolute inset-0" />

          <div class="bg-surface-elevated relative">
            <CodeBlock
              code={page.sdk.code}
              language={page.sdk.language}
              title={page.sdk.file}
            />
          </div>
        </div>
      </div>
    </LandingSection>

    <FrameworksList />
  {/if}

  <FaqSection faqs={page.faq} title={`${page.name} FAQ`} />

  <LandingSection>
    <nav aria-label="Keep exploring" class="grid grid-cols-1 lg:grid-cols-12">
      <h2
        class="border-hairline px-4 py-10 text-2xl font-medium tracking-[-0.02em] sm:px-6 lg:col-span-4 lg:border-r lg:px-10 lg:py-12"
      >
        Keep exploring
      </h2>

      <ul
        class="divide-hairline border-hairline divide-y border-t lg:col-span-8 lg:border-t-0"
      >
        <!-- eslint-disable svelte/no-navigation-without-resolve -- every href is resolved inline -->
        {#each links as link (link.href)}
          <li>
            <a
              href={resolve(link.href)}
              class="group flex items-center gap-4 px-4 py-5 sm:px-6 lg:px-10"
            >
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="font-medium">{link.title}</span>
                <span
                  class="text-neutral-400 group-hover:text-neutral-300 line-clamp-2 text-sm transition-ink duration-150"
                >
                  {link.description}
                </span>
              </span>
              <ChevronRightIcon
                class="text-neutral-600 group-hover:text-fg-default ml-auto size-4 shrink-0 transition-ink duration-150"
              />
            </a>
          </li>
        {/each}
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </ul>
    </nav>
  </LandingSection>

  <FinalCta />

  <LandingSection divider={false} class="h-12 lg:h-16" />

  <Footer />
</div>

{#snippet demoHeader()}
  {#if page.slug === 'monitoring'}
    <span class="font-medium">api.acme.com</span>
    <span class="text-neutral-500 text-xs">Every 15 s</span>
  {:else}
    <span class="font-medium">CPU usage</span>
    <span class="text-neutral-500 text-xs">Last 60 s</span>
  {/if}
  <span
    class="text-neutral-400 ml-auto flex shrink-0 items-center gap-1.5 text-xs"
  >
    <span class="bg-success size-1.5 rounded-full"></span>
    Live
  </span>
{/snippet}
