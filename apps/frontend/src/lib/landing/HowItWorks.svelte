<script>
	import {
		animatedViewState,
		AnimationDirection,
	} from '$lib/shared/ui/animated-view.state.svelte.js';
	import {
		ArrowRightIcon,
		ChartColumnStacked,
		LogsIcon,
		TerminalIcon,
	} from 'lucide-svelte';
	import Highlight from 'svelte-highlight';
	import { bash, typescript } from 'svelte-highlight/languages';
	import { githubDark } from 'svelte-highlight/styles';
</script>

<svelte:head>
	{@html githubDark}
</svelte:head>

<section id="how-it-works" class="px-4">
	<div class="ld-card mx-auto max-w-7xl py-10">
		<h2 class="text-secondary mb-16 text-center text-4xl font-bold">
			How it works?
		</h2>

		<div
			class="flex flex-col items-start justify-between gap-24 md:flex-row"
		>
			<!-- Step 1 -->
			<div
				class="flex flex-1 transform flex-col items-center text-center"
			>
				<div class="ld-card-base text-primary mb-6 rounded-full p-6">
					<TerminalIcon class="h-12 w-12" />
				</div>

				<h3 class="text-primary mb-2 text-2xl font-semibold">
					1. Install SDK
				</h3>

				<p class="text-base-content mb-4">
					Quick setup with a single command. Ready in seconds, not
					hours.
				</p>

				<Highlight
					class="code-snippet selection:bg-base-100"
					language={bash}
					code={`npm i @logdash/js-sdk`}
				/>
			</div>

			<!-- Step 2 -->
			<div
				class="flex flex-1 transform flex-col items-center text-center"
			>
				<div class="ld-card-base text-primary mb-6 rounded-full p-6">
					<LogsIcon class="h-12 w-12" />
				</div>

				<h3 class="text-secondary mb-2 text-2xl font-semibold">
					2. Capture data
				</h3>

				<p class="text-base-content mb-4">
					Integrate anywhere. Capture everything with just a few lines
					of code.
				</p>

				<Highlight
					class="code-snippet selection:bg-base-100 text-left"
					language={typescript}
					code={`logdash.error('An error');
metrics.set('connections', 5);
metrics.mutate('users', 1);`}
				/>
			</div>

			<div
				class="flex flex-1 transform flex-col items-center text-center"
			>
				<div class="ld-card-base text-primary mb-6 rounded-full p-6">
					<ChartColumnStacked class="h-12 w-12" />
				</div>

				<h3 class="text-secondary mb-2 text-2xl font-semibold">
					3. See real-time insights
				</h3>

				<p class="text-base-content/80 mb-4">
					Turn data into actionable intelligence with powerful
					analytics and visualizations.
				</p>

				<a
					onclick={() => {
						animatedViewState.nextAnimationDirection =
							AnimationDirection.LEFT;
					}}
					href="/demo-dashboard"
					class="btn btn-secondary"
				>
					Example Dashboard
					<ArrowRightIcon class="ml-1 h-5 w-5" />
				</a>
			</div>
		</div>
	</div>
</section>
