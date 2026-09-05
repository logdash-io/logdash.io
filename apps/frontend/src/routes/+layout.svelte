<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { isDev, uuid } from '$lib';
  import FooterEnding from '$lib/landing/FooterEnding.svelte';
  import Nav from '$lib/landing/Nav.svelte';
  import PageView from '$lib/landing/PageView.svelte';
  import {
    pageTransition,
    sectionKey,
  } from '$lib/landing/page-transition.svelte';
  import { smoothAnchors } from '$lib/landing/smooth-anchors';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
  import { logger } from '$lib/domains/shared/logger/index.js';
  import FeedbackButton from '$lib/domains/shared/ui/components/FeedbackButton.svelte';
  import NavigationLoadingBar from '$lib/domains/shared/ui/components/NavigationLoadingBar.svelte';
  import Toaster from '$lib/domains/shared/ui/toaster/Toaster.svelte';
  import { envConfig } from '$lib/domains/shared/utils/env-config';
  import posthog, { PostHog } from 'posthog-js';
  import { getContext, setContext, type Snippet } from 'svelte';
  import { atomOneDark } from 'svelte-highlight/styles';
  import '@fontsource-variable/inter/opsz.css';
  import '@fontsource-variable/geist-mono';
  import '@logdash/hyper-ui/styles';
  import { installPressFeedback } from '@logdash/hyper-ui/utils/press';

  type Props = {
    children: Snippet;
    data: { exposedConfig: ExposedConfig };
  };
  let { children, data }: Props = $props();

  const isPublicDashboardPath = (pathname: string) =>
    pathname.startsWith('/d/');
  const isAppPath = (pathname: string) => pathname.includes('/app');
  const isLandingPath = (pathname: string) =>
    !isPublicDashboardPath(pathname) && !isAppPath(pathname);

  const RECORDED_ROUTES = ['/', '/setup', '/configure', '/pricing'];
  const shouldRecordRoute = $derived(
    RECORDED_ROUTES.some((path) => page.url.pathname.includes(path)),
  );
  let loadedPosthogInstance: PostHog | null = $state(null);

  $effect(() => installPressFeedback(document));

  // The landing pages scroll the document, so scroll restoration on reload
  // and back/forward, hash jumps and scroll-to-top on navigation are the
  // browser's and SvelteKit's job. Page transitions live in
  // $lib/landing/page-transition.svelte.ts.
  onNavigate((navigation) => {
    if (navigation.type === 'popstate') return;
    const from = navigation.from?.url;
    const to = navigation.to?.url;
    if (!from || !to) return;
    if (!isLandingPath(to.pathname)) {
      pageTransition.reset();
      return;
    }
    if (to.pathname === from.pathname || to.hash) return;
    return pageTransition.startTakeover(from, to);
  });

  $effect.pre(() => {
    if (!browser) {
      return;
    }
    if (!isDev()) {
      posthog.init(envConfig.posthog.key, {
        api_host: envConfig.posthog.proxy,
        ui_host: envConfig.posthog.host,
        person_profiles: 'always',
        disable_session_recording: true,
        loaded(ph) {
          loadedPosthogInstance = ph;
        },
      });
    }

    setContext('posthog', posthog);
  });
  $effect.pre(() => {
    setContext('tabId', `tab-${uuid()}`);
    logger.debug('Tab ID:', getContext('tabId'));
  });

  $effect(() => {
    if (!loadedPosthogInstance) {
      return;
    }

    if (shouldRecordRoute && !isDev()) {
      logger.info('Starting session recording');
      loadedPosthogInstance.startSessionRecording();
    } else {
      logger.info('Not starting session recording for route');
      loadedPosthogInstance.stopSessionRecording();
    }
  });

  $effect(() => {
    exposedConfigState.set(data.exposedConfig);
  });
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html atomOneDark}
</svelte:head>

<svelte:boundary onerror={(error) => console.log('💥', error)}>
  <Toaster />
  <NavigationLoadingBar />

  {#if isPublicDashboardPath(page.url.pathname)}
    {@render children?.()}
  {:else if isAppPath(page.url.pathname)}
    <main
      class="relative flex max-h-dvh w-dvw flex-col items-center overflow-auto overflow-x-hidden"
    >
      {@render children?.()}
    </main>

    {#if !page.url.pathname.includes('/setup') && !page.url.pathname.includes('/configure')}
      <FeedbackButton hideOnMobile={true} />
    {/if}
  {:else}
    <!--
      The footer's ending (FooterEnding) is a fixed floor behind the page,
      driven by a view timeline declared inside it, so the scope lives on
      their common parent. The page content stacks above the floor.
    -->
    <div class="ld-page ld-page-bg relative w-full">
      <FooterEnding part="floor" />
      <div
        use:smoothAnchors
        class="relative z-0 flex w-full flex-col items-center"
      >
        <Nav />

        <PageView
          keyOf={sectionKey}
          class="relative flex w-full flex-col items-center"
        >
          {@render children()}
        </PageView>
      </div>
    </div>
  {/if}
</svelte:boundary>

<style>
  .ld-page {
    timeline-scope: --ld-ending;
  }

  /*
    hyper-ui locks html and body (`overflow: hidden`) for the app shell, whose
    panes scroll on their own. The landing pages hand scrolling back to the
    document instead: the browser then restores the scroll position on reload
    and back/forward before the first paint, and `scrollbar-gutter` keeps the
    column still on platforms that inset a classic scrollbar. Body stays
    `visible` so it is not a scroll container of its own, which would break
    the sticky nav and the ending's view timeline.
  */
  :global(html:has(.ld-page)) {
    overflow: hidden auto;
    scroll-behavior: auto;
    scrollbar-gutter: stable;
  }

  :global(html:has(.ld-page) body) {
    overflow: visible;
  }
</style>
