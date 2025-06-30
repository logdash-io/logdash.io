<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { isDev, uuid } from '$lib';
  import Nav from '$lib/landing/Nav.svelte';
  import { exposedConfigState } from '$lib/shared/exposed-config/application/exposed-config.state.svelte.js';
  import type { ExposedConfig } from '$lib/shared/exposed-config/domain/exposed-config.js';
  import { logger } from '$lib/shared/logger/index.js';
  import FeedbackButton from '$lib/shared/ui/components/FeedbackButton.svelte';
  import Toaster from '$lib/shared/ui/toaster/Toaster.svelte';
  import { envConfig } from '$lib/shared/utils/env-config';
  import posthog, { PostHog } from 'posthog-js';
  import { getContext, setContext, type Snippet } from 'svelte';
  import { atomOneDark } from 'svelte-highlight/styles';
  import '../styles/main.css';

  type Props = {
    children: Snippet;
    data: { exposedConfig: ExposedConfig };
  };
  let { children, data }: Props = $props();
  let scrollContainer: HTMLDivElement = $state(null);
  const isDemoDashboard = $derived(
    page.url.pathname.includes('/demo-dashboard'),
  );
  const RECORDED_ROUTES = ['/setup', '/configure', '/pricing'];
  const shouldRecordRoute = $derived(
    RECORDED_ROUTES.some((path) => page.url.pathname.includes(path)),
  );
  let loadedPosthogInstance: PostHog | null = $state(null);

  $effect.pre(() => {
    if (browser && !isDev()) {
      posthog.init(envConfig.posthog.key, {
        api_host: envConfig.posthog.proxy,
        ui_host: envConfig.posthog.host,
        person_profiles: 'always',
        disable_session_recording: true,
        loaded(ph) {
          loadedPosthogInstance = ph;
        },
      });
      setContext('posthog', posthog);
    }
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

  $effect(() => {
    page.url.pathname;

    if (!scrollContainer || isDemoDashboard) {
      return;
    }

    scrollContainer.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
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
      class="gutter-both relative flex max-h-dvh w-dvw flex-col items-center overflow-auto overflow-x-hidden"
    >
      {@render children?.()}
    </main>

    {#if !page.url.pathname.includes('/setup') && !page.url.pathname.includes('/configure')}
      <FeedbackButton />
    {/if}
  {:else}
    <div
      bind:this={scrollContainer}
      class="gutter-both overflxow-x-hidden relative flex h-dvh w-dvw flex-col items-center overflow-auto overflow-x-hidden scroll-smooth"
    >
      <Nav />

      <div class="relative flex h-full w-full flex-col items-center">
        {@render children()}
      </div>

      <FeedbackButton />
    </div>
  {/if}
</svelte:boundary>
