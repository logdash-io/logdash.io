<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Logo from '$lib/shared/icons/Logo.svelte';
	import { RoutePath } from '$lib/shared/route-path.js';
	import { UserTier } from '$lib/shared/types.js';
	import JoinTelegramGroupButton from '$lib/shared/ui/components/JoinTelegramGroupButton.svelte';
	import { userState } from '$lib/shared/user/application/user.state.svelte.js';
	import { fade } from 'svelte/transition';
	import { clustersState } from '../../application/clusters.state.svelte.js';
	import { getContext } from 'svelte';
	import type { PostHog } from 'posthog-js';

	type BreadcrumbStep = {
		name: string;
		path: string;
	};
	let upgrading = $state(false);

	const posthog = getContext<PostHog>('posthog');
	const breadcrumb: BreadcrumbStep[] = $derived.by(() => {
		const allProjectsStep: BreadcrumbStep = {
			name: 'All Projects',
			path: '/app/clusters',
		};
		if (page.url.pathname.includes('/setup')) {
			return [
				{
					name: 'Setup',
					path: `/app/clusters/new`,
				},
			];
		}

		if (page.params.cluster_id) {
			return [
				allProjectsStep,
				{
					name: clustersState.clusters.find(
						(p) => p.id === page.params.cluster_id,
					)?.name,
					path: page.params.cluster_id,
				},
			];
		}

		return [allProjectsStep];
	});
</script>

{#snippet navBreadcrumb()}
	{#each breadcrumb as breadcrumbStep, i}
		<a
			draggable="false"
			data-posthog-id="cluster-nav-breadcrumb"
			href={i === 0
				? `${breadcrumbStep.path}`
				: `${breadcrumb
						.slice(0, i + 1)
						.map((b) => b.path)
						.join('/')}`}
			class={[
				{
					'font-semibold': i === breadcrumb.length - 1,
				},
				{
					'opacity-60': i !== breadcrumb.length - 1,
				},
			]}
		>
			/{breadcrumbStep.name}
		</a>
	{/each}
{/snippet}

<div class="bg-base-300/50 sticky top-0 z-50 pb-2 backdrop-blur-lg sm:pb-0">
	<div class="navbar xl:w-7xl mx-auto pb-0 pl-0 sm:pb-2 sm:pl-2">
		<div class="navbar-start">
			<a href="/" class="flex items-center justify-start gap-2">
				<Logo class="h-10 w-10" />
				<span class="text-2xl font-bold">logdash</span>
			</a>
		</div>

		<div class="navbar-center hidden truncate font-mono text-sm sm:block">
			{@render navBreadcrumb()}
		</div>

		<div class="navbar-end">
			<div class="dropdown z-10">
				<div
					tabindex="0"
					role="button"
					class="btn btn-ghost btn-circle"
				>
					<div class="indicator">
						<span
							class={[
								'indicator-item indicator-bottom badge-soft indicator-center badge badge-xs',
								{
									'badge-primary':
										userState.tier === UserTier.EARLY_BIRD,
									'badge-secondary':
										userState.tier === UserTier.FREE,
								},
							]}
						>
							{userState.tier.replaceAll('-', ' ')}
						</span>

						<div
							class={[
								'avatar',
								{
									'avatar-placeholder': !userState.avatar,
								},
							]}
						>
							<div class="bg-base-100 w-8 rounded-full">
								{#if userState.avatar}
									<img src={userState.avatar} />
								{:else}
									<span class="text-lg">A</span>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<ul
					tabindex="0"
					class="menu dropdown-content bg-base-100 rounded-box z-1 mt-3 w-44 p-2 shadow"
				>
					<li>
						<a
							onclick={() => {
								upgrading = true;
								if (userState.tier === UserTier.FREE) {
									// todo: should it become part of the RoutePath enum?
									goto('/app/api/user/upgrade');
								} else {
									goto('/app/api/user/billing');
								}
							}}
						>
							{#if userState.tier === UserTier.FREE}
								Upgrade
							{:else}
								Billing
							{/if}

							{#if upgrading}
								<div
									in:fade={{ duration: 150 }}
									class="flex h-4 w-4 items-center justify-center"
								>
									<span
										class="loading loading-sm loading-spinner"
									></span>
								</div>
							{/if}
						</a>
					</li>

					<li>
						<a
							onclick={() => {
								posthog.reset();
							}}
							href={RoutePath.LOGOUT}
						>
							Logout
						</a>
					</li>

					<li class="indicator">
						{#if userState.tier === UserTier.FREE}
							<span
								class="indicator-item badge badge-soft badge-xs badge-primary"
							>
								Upgrade
							</span>
						{/if}
						<JoinTelegramGroupButton tier={userState.tier} />
					</li>
				</ul>
			</div>
		</div>
	</div>

	<div class="px-1 sm:hidden">
		{@render navBreadcrumb()}
	</div>
</div>
