<script lang="ts">
	import { browser } from '$app/environment';
	import FeedbackButton from '$lib/shared/ui/components/FeedbackButton.svelte';
	import { envConfig } from '$lib/shared/utils/env-config';
	import posthog from 'posthog-js';
	import { getContext, onMount, type Snippet } from 'svelte';
	import '../app.css';
	import { page } from '$app/state';
	import Nav from '$lib/landing/Nav.svelte';
	import Toaster from '$lib/shared/ui/toaster/Toaster.svelte';
	import { atomOneDark } from 'svelte-highlight/styles';
	import { setContext } from 'svelte';
	import { isDev, uuid } from '$lib';
	import { logger } from '$lib/shared/logger/index.js';
	import type { ExposedConfig } from '$lib/shared/exposed-config/domain/exposed-config.js';
	import { exposedConfigState } from '$lib/shared/exposed-config/application/exposed-config.state.svelte.js';

	type Props = {
		children: Snippet;
		data: { exposedConfig: ExposedConfig };
	};
	let { children, data }: Props = $props();
	let scrollContainer: HTMLDivElement;
	const isDemoDashboard = $derived(
		page.url.pathname.includes('/demo-dashboard'),
	);
	const RECORDED_ROUTES = ['/setup', '/configure'];

	$effect.pre(() => {
		if (browser) {
			posthog.init(envConfig.posthog.key, {
				api_host: envConfig.posthog.proxy,
				ui_host: envConfig.posthog.host,
				person_profiles: 'always',
				// person_profiles: 'identified_only'
				disable_session_recording: true,
				loaded(ph) {
					if (
						RECORDED_ROUTES.some((path) =>
							page.url.pathname.includes(path),
						) &&
						!isDev()
					) {
						logger.info(
							'Starting session recording for route:',
							page.url.pathname,
						);
						ph.startSessionRecording();
					}
				},
			});
			setContext('posthog', posthog);
		}
		setContext('tabId', `tab-${uuid()}`);
		logger.debug('Tab ID:', getContext('tabId'));
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

<Toaster />

{#if page.url.pathname.includes('/app')}
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
		class="gutter-both overflxow-x-hidden relative flex h-dvh w-dvw flex-col items-center overflow-auto overflow-x-hidden"
	>
		<Nav />

		<div class="relative flex h-full w-full flex-col items-center">
			{@render children()}
		</div>

		<FeedbackButton />
	</div>
{/if}
