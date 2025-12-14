<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { isDev, uuid } from '$lib';
  import Nav from '$lib/landing/Nav.svelte';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config.js';
  import { logger } from '$lib/domains/shared/logger/index.js';
  import FeedbackButton from '$lib/domains/shared/ui/components/FeedbackButton.svelte';
  import Toaster from '$lib/domains/shared/ui/toaster/Toaster.svelte';
  import { envConfig } from '$lib/domains/shared/utils/env-config';
  import posthog, { PostHog } from 'posthog-js';
  import { getContext, setContext, type Snippet } from 'svelte';
  import { atomOneDark } from 'svelte-highlight/styles';
  import '@fontsource-variable/kumbh-sans';
  import '@fontsource-variable/geist-mono';
  import '@logdash/hyper-ui/styles';
  import { ScrollArea } from '@logdash/hyper-ui/presentational';

  type Props = {
    children: Snippet;
    data: { exposedConfig: ExposedConfig };
  };
  let { children, data }: Props = $props();
  let scrollContainer: HTMLDivElement | null = $state(null);
  const isDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );
  const RECORDED_ROUTES = ['/', '/setup', '/configure', '/pricing'];
  const shouldRecordRoute = $derived(
    RECORDED_ROUTES.some((path) => page.url.pathname.includes(path)),
  );
  let loadedPosthogInstance: PostHog | null = $state(null);

  const SCROLL_KEY = 'scrollPositions';

  function getScrollPositions(): Record<string, number> {
    try {
      return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveScrollPosition() {
    if (!scrollContainer) return;
    const positions = getScrollPositions();
    positions[page.url.pathname] = scrollContainer.scrollTop;
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions));
  }

  function restoreScrollPosition(): boolean {
    if (!scrollContainer) return false;
    const positions = getScrollPositions();
    const top = positions[page.url.pathname];

    if (top !== undefined && top > 0) {
      scrollContainer.scrollTo({ top, behavior: 'smooth' });
      return true;
    }
    return false;
  }

  function scrollToTop() {
    if (!scrollContainer || isDemoDashboard) return;
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $effect(() => {
    if (!scrollContainer) return;

    restoreScrollPosition();

    const handleScroll = () => saveScrollPosition();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  });

  afterNavigate(() => {
    if (!restoreScrollPosition()) {
      scrollToTop();
    }
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
  {@html atomOneDark}
</svelte:head>

<svelte:boundary onerror={(error, reset) => console.log('💥', error)}>
  <Toaster />

  {#if page.url.pathname.startsWith('/d/')}
    {@render children?.()}
  {:else if page.url.pathname.includes('/app')}
    <main
      class="relative flex max-h-dvh w-dvw flex-col items-center overflow-auto overflow-x-hidden"
    >
      {@render children?.()}
    </main>

    {#if !page.url.pathname.includes('/setup') && !page.url.pathname.includes('/configure')}
      <FeedbackButton />
    {/if}
  {:else}
    <ScrollArea
      bind:viewportRef={scrollContainer}
      class="overflxow-x-hidden relative flex h-dvh w-dvw flex-col items-center overflow-auto overflow-x-hidden scroll-smooth"
    >
      <Nav />

      <div class="relative flex h-full w-full flex-col items-center">
        {@render children()}
      </div>

      <FeedbackButton />
    </ScrollArea>
  {/if}
</svelte:boundary>
