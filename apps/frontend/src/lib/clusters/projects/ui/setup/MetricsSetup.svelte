<script lang="ts">
	import MetricsListener from '$lib/clusters/projects/ui/presentational/MetricsListener.svelte';
	import MetricsTiles from '$lib/clusters/projects/ui/ProjectView/tiles/MetricsTiles.svelte';
	import { LogdashSDKName, type LogdashSDK } from '$lib/shared/types.js';
	import { CheckCircle, CheckIcon, Copy } from 'lucide-svelte';
	import { getContext, onMount, type Snippet } from 'svelte';
	import Highlight from 'svelte-highlight';
	import {
		python,
		ruby,
		type LanguageType,
	} from 'svelte-highlight/languages';
	import typescript from 'svelte-highlight/languages/typescript';
	import { metricsState } from '../../application/metrics.state.svelte.js';
	import SDKInstaller from './SDKInstaller.svelte';
	import SetupPrompt from './SetupPrompt.svelte';

	type Props = {
		project_id: string;
		api_key: string;
		claimer: Snippet<[boolean]>;
	};
	const { project_id, claimer, api_key }: Props = $props();
	let selectedSDK: LogdashSDK = $state();

	let copied = $state(false);
	let installationCode = $state('');

	const hasMetrics = $derived(metricsState.simplifiedMetrics.length > 0);

	$effect(() => {
		let timeout;

		if (!copied) {
			clearTimeout(timeout);
			return;
		}

		timeout = setTimeout(() => {
			copied = false;
		}, 2000);

		return () => {
			clearTimeout(timeout);
		};
	});

	onMount(() => {
		const tabId: string = getContext('tabId');
		metricsState.sync(project_id, tabId);
		return () => {
			metricsState.unsync();
		};
	});

	type SDKMetricsSetup = Record<
		LogdashSDK['name'],
		{
			language: LanguageType<string>;
			code: string;
		}
	>;

	const SDK_METRICS_SETUPS: SDKMetricsSetup = {
		[LogdashSDKName.NODE_JS]: {
			language: typescript,
			code: `import { createLogDash } from '@logdash/js-sdk';

const { metrics } = createLogDash({
	apiKey: "${api_key}"
});

// set absolute value
metrics.set('users', 0);
// or modify existing one
metrics.mutate('users', 1);`,
		},
		[LogdashSDKName.PYTHON]: {
			language: python,
			code: `from logdash import create_logdash

logdash = create_logdash({
    # optional, but recommended as metrics are only hosted remotely
    "api_key": "${api_key}",
})

# Access metrics
metrics = logdash.metrics

# to set absolute value
metrics.set("users", 0)

# or modify existing one
metrics.mutate("users", 1)`,
		},
		[LogdashSDKName.JAVA]: {
			language: null,
			code: null,
		},
		[LogdashSDKName.PHP]: {
			language: null,
			code: null,
		},
		[LogdashSDKName.RUBY]: {
			language: ruby,
			code: `require 'logdash'

# api_key is optional, but recommended as metrics are only hosted remotely
logdash_client = Logdash.create(api_key: "${api_key}")

# Access metrics
metrics = $logdash_client[:metrics]

# to set absolute value
metrics.set('users', 0)

# or modify existing one
metrics.mutate('users', 1)`,
		},
		[LogdashSDKName.DOTNET]: {
			language: null,
			code: null,
		},
		[LogdashSDKName.OTHER]: {
			language: null,
			code: null,
		},
	};

	let setupPrompt = $derived(
		`Generate a minimal ${selectedSDK?.name} code snippet to initialize Logdash metrics.  
First, install the package using default repo package manager, otherwise fallback to the following command:

${installationCode}

Then, here’s the exact code block to use (no comments, no explanation, do NOT include the install command):

${SDK_METRICS_SETUPS[selectedSDK?.name]?.code}

The prompt should output **only** this install command and this exact code block, no explanations or extras.`,
	);
</script>

<div class="w-full">
	<MetricsTiles />
</div>

<div class="fixed left-0 top-0 z-50 flex h-full w-full bg-black/60">
	<div
		class="bg-base-200 sm:w-xl absolute right-0 top-0 mx-auto flex h-full w-full max-w-2xl flex-col gap-4 p-6 sm:p-8"
	>
		<div class="space-y-2">
			<h5 class="text-2xl font-semibold">
				Setup Metrics for your project
			</h5>

			<p class="text-base-content opacity-60">
				Integrate Logdash with your preferred SDK. Your dashboard will
				update automatically when you send metrics.
			</p>

			<SetupPrompt prompt={setupPrompt} />
		</div>

		<div class="collapse-open collapse">
			<SDKInstaller bind:selectedSDK bind:installationCode />
		</div>

		<div class="collapse-open collapse">
			<div class="px-1 py-4 font-semibold">
				<span>2. Create Logdash instance</span>
			</div>

			<div class="space-y-2 overflow-hidden text-sm">
				<div class="relative text-base">
					<Highlight
						class="code-snippet selection:bg-base-100"
						language={SDK_METRICS_SETUPS[selectedSDK.name].language}
						code={SDK_METRICS_SETUPS[selectedSDK.name].code}
					/>

					<label
						onclick={() => {
							navigator.clipboard.writeText(
								SDK_METRICS_SETUPS[selectedSDK.name].code,
							);
						}}
						for="copy-code-1"
						class="btn btn-md btn-square bg-base-100 swap swap-rotate absolute right-2 top-2 border-transparent"
					>
						<input
							id="copy-code-1"
							bind:checked={copied}
							type="checkbox"
						/>

						<CheckIcon class="swap-on text-success h-5 w-5" />

						<Copy class="swap-off h-5 w-5" />
					</label>
				</div>
			</div>
		</div>

		<div class="collapse-open">
			<div class="px-1 py-4 font-semibold">
				<span>3. Capture metrics</span>
			</div>

			<div class="text-sm">
				<MetricsListener
					onCaptureOnce={() => {
						// toast.success('Logs captured!');
					}}
				>
					<div
						class="flex items-center justify-start gap-2 font-semibold"
					>
						<CheckCircle class="text-success h-5 w-5" />
						<span class="text-success opacity-80">
							Metrics captured successfully!
						</span>
					</div>
				</MetricsListener>
			</div>
		</div>

		{@render claimer(hasMetrics)}
	</div>
</div>
