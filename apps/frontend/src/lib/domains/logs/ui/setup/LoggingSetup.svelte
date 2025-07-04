<script lang="ts">
  import { logsState } from '$lib/domains/logs/application/logs.state.svelte.js';
  import LogsListener from '$lib/domains/logs/ui/LogsListener.svelte';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import LogsLineChartTile from '$lib/domains/logs/ui/LogMetricsTile.svelte';
  import LogsListTile from '$lib/domains/logs/ui/logs-tile/LogsTile.svelte';
  import {
    LogdashSDKName,
    type LogdashSDK,
  } from '$lib/domains/shared/types.js';
  import { CheckCircle, CheckIcon, Copy } from 'lucide-svelte';
  import { getContext, onMount, type Snippet } from 'svelte';
  import Highlight from 'svelte-highlight';
  import {
    csharp,
    go,
    java,
    python,
    ruby,
    rust,
    type LanguageType,
  } from 'svelte-highlight/languages';
  import typescript from 'svelte-highlight/languages/typescript';
  import { logMetricsState } from '$lib/domains/logs/application/log-metrics.state.svelte.js';
  import SDKInstaller from '$lib/domains/shared/ui/setup/SDKInstaller.svelte';
  import SetupPrompt from '$lib/domains/shared/ui/setup/SetupPrompt.svelte';

  type Props = {
    project_id: string;
    api_key: string;
    claimer: Snippet<[boolean]>;
  };
  const { project_id, claimer, api_key }: Props = $props();
  const hasLogs = $derived(logsState.logs.length > 0);

  let selectedSDK: LogdashSDK = $state();
  let copied = $state(false);
  let installationCode = $state('');

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

logger.info("Application started successfully")
logger.error("An unexpected error occurred")
logger.warn("Low disk space warning")`,
    },
    [LogdashSDKName.PYTHON]: {
      language: python,
      code: `from logdash import create_logdash

logdash = create_logdash({
  "api_key": "${api_key}",
})

logger = logdash.logger

logger.info("Application started successfully")
logger.error("An unexpected error occurred")
logger.warn("Low disk space warning")

# wait to ensure logs were sent
time.sleep(5)
`,
    },
    [LogdashSDKName.JAVA]: {
      language: java,
      code: `import io.logdash.sdk.Logdash;

var logdash = Logdash.builder()
        .apiKey("${api_key}")
        .build();

var logger = logdash.logger();

logger.info("Application started successfully");
logger.error("An unexpected error occurred");
logger.warn("Low disk space warning");

// optionally, gracefully close logdash client
logdash.close();`,
    },
    [LogdashSDKName.PHP]: {
      language: null,
      code: null,
    },
    [LogdashSDKName.RUBY]: {
      language: ruby,
      code: `require 'logdash'

logdash_client = Logdash.create(api_key: "${api_key}")

logger = logdash_client[:logger]

logger.info('Application started successfully')
logger.error('An unexpected error occurred')
logger.warn('Low disk space warning')

# wait to ensure logs were sent
sleep 5`,
    },
    [LogdashSDKName.DOTNET]: {
      language: csharp,
      code: `using Logdash;
using Logdash.Models;

var builder = new LogdashBuilder();
var (logdash, metrics) = builder.WithHttpClient(new HttpClient())
    .WithInitializationParams(new InitializationParams("${api_key}"))
    .Build();

logger.Info("Application started successfully");
logger.Error("An unexpected error occurred");
logger.Warn("Low disk space warning");

// wait to ensure logs were sent
await Task.Delay(5000); 
`,
    },
    [LogdashSDKName.RUST]: {
      language: rust,
      code: `let (logger, _) = logdash::create_logdash(logdash::Config::default().api_key("${api_key}".into()));

logger.info("Application started successfully");
logger.error("An unexpected error occurred");
logger.warn("Low disk space warning");

// wait to ensure logs were sent
thread::sleep(Duration::from_secs(5));`,
    },
    [LogdashSDKName.GO]: {
      language: go,
      code: `ld := logdash.New(
  logdash.WithApiKey("${api_key}"),
)

logger := logdash.logger

logger.Info("Application started successfully")
logger.Error("An unexpected error occurred")
logger.Warn("Low disk space warning")

// wait to ensure logs were sent
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
ld.Shutdown(ctx)
    `,
    },
    [LogdashSDKName.OTHER]: {
      language: null,
      code: null,
    },
  };

  let setupPrompt = $derived(
    `Generate a minimal ${selectedSDK?.name} code snippet to initialize Logdash logging.  
First, install the package using default repo package manager, otherwise fallback to the following command:

${installationCode}

Then, here’s the exact code block to use (no comments, no explanation, do NOT include the install command):

${SDK_LOGGING_SETUPS[selectedSDK?.name]?.code}

The prompt should output **only** this install command and this exact code block, no explanations or extras.`,
  );
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
    class="bg-base-200 absolute top-0 right-0 mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-auto p-6 sm:w-xl sm:p-8"
  >
    <div class="space-y-2">
      <h5 class="text-2xl font-semibold">Setup Logging for your service</h5>

      <p class="text-base-content opacity-60">
        Integrate Logdash with your preferred SDK. Your dashboard will update
        automatically when you send logs.
      </p>

      <SetupPrompt prompt={setupPrompt} />
    </div>

    <div class="collapse-open collapse z-10">
      <SDKInstaller bind:installationCode bind:selectedSDK />
    </div>

    <div class="collapse-open collapse">
      <div class="px-1 py-4 font-semibold">
        <span>2. Setup fresh logger instance</span>
      </div>

      <div class="space-y-2 overflow-hidden text-sm">
        <div class="relative text-base">
          <Highlight
            class="code-snippet selection:bg-base-100"
            code={SDK_LOGGING_SETUPS[selectedSDK.name].code}
            language={SDK_LOGGING_SETUPS[selectedSDK.name].language}
          />

          <label
            class="btn btn-md btn-square bg-base-100 swap swap-rotate absolute top-2 right-2 border-transparent"
            for="copy-code-1"
            onclick={() => {
              navigator.clipboard.writeText(
                SDK_LOGGING_SETUPS[selectedSDK.name].code,
              );
            }}
          >
            <input bind:checked={copied} id="copy-code-1" type="checkbox" />

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
          <div class="flex items-center justify-start gap-2 font-semibold">
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
