<script lang="ts">
	import { logsState } from '$lib/clusters/projects/application/logs.state.svelte';
	import LogsListener from '$lib/clusters/projects/ui/presentational/LogsListener.svelte';
	import DataTile from '$lib/clusters/projects/ui/ProjectView/tiles/DataTile.svelte';
	import LogsLineChartTile from '$lib/clusters/projects/ui/ProjectView/tiles/LogsLineChartTile.svelte';
	import LogsListTile from '$lib/clusters/projects/ui/ProjectView/tiles/LogsListTile.svelte';
	import { LogdashSDKName, type LogdashSDK } from '$lib/shared/types.js';
	import { CheckCircle, CheckIcon, Copy } from 'lucide-svelte';
	import { getContext, onMount, type Snippet } from 'svelte';
	import Highlight from 'svelte-highlight';
	import { python, type LanguageType } from 'svelte-highlight/languages';
	import typescript from 'svelte-highlight/languages/typescript';
	import SDKInstaller from './SDKInstaller.svelte';
	import { logMetricsState } from '../../application/log-metrics.state.svelte.js';

	type Props = {
		project_id: string;
		api_key: string;
		claimer: Snippet<[boolean]>;
	};
	const { project_id, claimer, api_key }: Props = $props();
	const hasLogs = $derived(logsState.logs.length > 0);

	let selectedSDK: LogdashSDK = $state();
	let copied = $state(false);

	onMount(() => {
		const tabId: string = getContext('tabId');
		logsState.sync(project_id, tabId);
		logMetricsState.sync(project_id, tabId);
		return () => {
			logsState.unsync();
			logMetricsState.unsync();
		};
	});

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

	type SDKMetricsSetup = Record<
		LogdashSDK['name'],
		{
			language: LanguageType<string>;
			code: string;
		}
	>;

	const SDK_LOGGING_SETUPS: SDKMetricsSetup = {
		[LogdashSDKName.NODE_JS]: {
			language: typescript,
			code: `import { createLogDash } from '@logdash/js-sdk';

const { logger } = createLogDash({
	apiKey: "${api_key}"
});

logger.info('Hello logdash!');`,
		},
		[LogdashSDKName.PYTHON]: {
			language: python,
			code: `from logdash import create_logdash

logdash = create_logdash({
    # optional, but recommended to see your logs in the dashboard
    "api_key": "${api_key}",
})

# Access the logger
logger = logdash.logger

logger.info("Application started successfully")
logger.error("An unexpected error occurred")
logger.warn("Low disk space warning")`,
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
			language: null,
			code: null,
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

	let tryingToClaim = $state(false);
</script>

<div class="w-full space-y-8">
	<DataTile delayIn={0} delayOut={50}>
		<LogsListTile />
	</DataTile>

	<DataTile delayIn={100}>
		<LogsLineChartTile />
	</DataTile>
</div>

<div class="fixed top-0 left-0 z-50 flex h-full w-full bg-black/60">
	<div
		class="bg-base-200 absolute top-0 right-0 mx-auto flex h-full w-xl max-w-2xl flex-col gap-4 p-8"
	>
		<div class="space-y-2">
			<h5 class="text-2xl font-semibold">
				Setup Logging for your project
			</h5>

			<p class="text-base-content opacity-60">
				Integrate Logdash with your preferred SDK. Your dashboard will
				update automatically when you send logs.
			</p>
		</div>

		<div class="collapse-open collapse">
			<SDKInstaller bind:selectedSDK />
		</div>

		<div class="collapse-open collapse">
			<div class="px-1 py-4 font-semibold">
				<span>2. Setup fresh logger instance</span>
			</div>

			<div class="space-y-2 overflow-hidden text-sm">
				<div class="relative text-base">
					<Highlight
						class="code-snippet selection:bg-base-100"
						language={SDK_LOGGING_SETUPS[selectedSDK.name].language}
						code={SDK_LOGGING_SETUPS[selectedSDK.name].code}
					/>

					<label
						onclick={() => {
							navigator.clipboard.writeText(
								SDK_LOGGING_SETUPS[selectedSDK.name].code,
							);
						}}
						for="copy-code-1"
						class="btn btn-md btn-square bg-base-100 swap swap-rotate absolute top-2 right-2 border-transparent"
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
				<span>3. Capture logs</span>
			</div>

			<div class="text-sm">
				<LogsListener
					onCaptureOnce={() => {
						// toast.success('Logs captured!');
					}}
				>
					<div
						class="flex items-center justify-start gap-2 font-semibold"
					>
						<CheckCircle class="text-success h-5 w-5" />
						<span class="text-success opacity-80">
							Logs captured successfully!
						</span>
					</div>
				</LogsListener>
			</div>
		</div>

		{@render claimer(hasLogs)}
	</div>
</div>
