<script lang="ts">
	import { page } from '$app/state';
	import { logsState } from '$lib/clusters/projects/application/logs.state.svelte';
	import { intersect } from '$lib/shared/ui/actions/use-intersect.svelte';
	import LogRow from '$lib/shared/ui/components/LogRow.svelte';
	import { onMount, tick } from 'svelte';
	import { scale } from 'svelte/transition';
	import LogsListener from '../../presentational/LogsListener.svelte';

	let rendered = $state(false);
	let startIntersecting = $state(false);
	let list = $state(null);
	let sendingTestLogCooldown = $state(0);
	const projectId = $derived(page.url.searchParams.get('project_id'));

	onMount(() => {
		const t = setTimeout(() => {
			rendered = true;
		}, 500);

		return () => {
			clearTimeout(t);
		};
	});

	$effect.pre(() => {
		if (!list) {
			return;
		}

		logsState.logs.length;

		if (list.offsetHeight + list.scrollTop > list.scrollHeight - 20) {
			tick().then(() => {
				list?.scrollTo(0, list.scrollHeight);
			});
		}
	});

	let prevScrollHeight = 0;
	let prevScrollTop = 0;

	$effect.pre(() => {
		if (logsState.pageIsLoading && list) {
			// Store position before loading
			prevScrollHeight = list.scrollHeight;
			prevScrollTop = list.scrollTop;
		}
	});

	$effect(() => {
		if (!logsState.pageIsLoading && prevScrollHeight > 0 && list) {
			// Adjust position after loading
			const newScrollHeight = list.scrollHeight;
			const heightDifference = newScrollHeight - prevScrollHeight;
			list.scrollTop = prevScrollTop + heightDifference;
			prevScrollHeight = 0;
		}
	});

	function initializeList(node) {
		if (!node) {
			return;
		}

		list.scrollTo(0, list.scrollHeight);
	}

	function loadPreviousPage() {
		if (!list || logsState.pageIsLoading) {
			return;
		}

		// Only load previous page if the container is actually scrollable
		if (list.scrollHeight <= list.clientHeight) {
			return;
		}

		// Store the current scroll height and scroll position
		const prevScrollHeight = list.scrollHeight;
		const prevScrollTop = list.scrollTop;

		queueMicrotask(async () => {
			await logsState.loadPreviousPage(projectId);

			// After loading completes and DOM updates, adjust scroll position
			tick().then(() => {
				if (!list) {
					return;
				}
				const newScrollHeight = list.scrollHeight;
				const heightDifference = newScrollHeight - prevScrollHeight;
				list.scrollTop = prevScrollTop + heightDifference;
			});
		});
	}
</script>

<LogsListener>
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-4">
			<h2 class="font-semibold">Project logs</h2>

			<button
				class="btn btn-primary btn-xs mr-auto gap-1.5"
				onclick={() => {
					sendingTestLogCooldown = 5;
					const interval = setInterval(() => {
						sendingTestLogCooldown--;

						if (sendingTestLogCooldown < 1) {
							clearInterval(interval);
						}
					}, 1000);
					logsState.sendTestLog(projectId);
				}}
				disabled={sendingTestLogCooldown > 0}
				data-posthog-id="send-test-log-button"
			>
				<span>Send test log</span>
				{#if sendingTestLogCooldown > 0}
					<span
						class="font-mono"
						in:scale|global={{ start: 0.8, duration: 200 }}
					>
						({sendingTestLogCooldown}s)
					</span>
				{/if}
			</button>

			<span class="loading loading-ring loading-sm"></span>
		</div>

		<div
			class="relative flex h-full max-h-96 flex-1 flex-col-reverse overflow-hidden"
		>
			<div
				bind:this={list}
				use:initializeList
				class="styled-scrollbar flex h-full max-h-full flex-col gap-1.5 overflow-auto sm:gap-0"
			>
				<div
					class="h-0.5 w-full shrink-0"
					use:intersect={{
						callback: ({ isIntersecting }) => {
							if (
								isIntersecting &&
								list &&
								list.scrollHeight > list.clientHeight
							) {
								loadPreviousPage();
							}
						},
					}}
				></div>

				<div
					class="flex h-12 shrink-0 items-center justify-center gap-2"
				>
					{#if logsState.pageIsLoading}
						<span
							class="loading loading-spinner loading-sm opacity-80"
						></span>
					{/if}
				</div>

				{#each logsState.logs as log, index (log.id)}
					<div
						in:scale|global={{
							start: 0.98,
							duration: 200,
							delay: rendered
								? 0
								: index >=
									  Math.max(0, logsState.logs.length - 50)
									? 5 *
										(index -
											Math.max(
												0,
												logsState.logs.length - 50,
											))
									: 0,
						}}
					>
						<LogRow
							date={log.createdAt}
							level={log.level}
							message={log.message}
						/>
					</div>
				{/each}
			</div>
		</div>
	</div>
</LogsListener>
