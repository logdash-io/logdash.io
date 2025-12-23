import { LogdashSDKName } from '$lib/domains/shared/types.js';
import { INSTALL_COMMANDS } from './sdk-config.js';

export function getCodeSnippet(
  sdkName: LogdashSDKName,
  apiKey: string,
): string {
  const snippets: Record<LogdashSDKName, string> = {
    [LogdashSDKName.NODE_JS]: `import { Logdash } from '@logdash/node';

const logdash = new Logdash("${apiKey}");

logger.info("Application started successfully")
logger.error("An unexpected error occurred")
logger.warn("Low disk space warning")

// namespaces
const authLogdash = logdash.withNamespace('auth');

authLogdash.info("User authenticated successfully");
authLogdash.error("Invalid credentials");
authLogdash.warn("Password reset requested");

// graceful shutdown
logdash.flush();
`,
    [LogdashSDKName.PYTHON]: `from logdash import create_logdash

logdash = create_logdash({
  "api_key": "${apiKey}",
})

logger = logdash.logger

logger.info("Application started successfully")
logger.error("An unexpected error occurred")
logger.warn("Low disk space warning")

# wait to ensure logs were sent
time.sleep(5)`,
    [LogdashSDKName.JAVA]: `import io.logdash.sdk.Logdash;

var logdash = Logdash.builder()
        .apiKey("${apiKey}")
        .build();

var logger = logdash.logger();

logger.info("Application started successfully");
logger.error("An unexpected error occurred");
logger.warn("Low disk space warning");

// optionally, gracefully close logdash client
logdash.close();`,
    [LogdashSDKName.PHP]: `<?php

require_once 'vendor/autoload.php';

use Logdash\\Logdash;

$logdash = Logdash::create([
    'apiKey' => '${apiKey}'
]);

$logger = $logdash->logger();

$logger->info("Application started successfully");
$logger->error("An unexpected error occurred");
$logger->warn("Low disk space warning");`,
    [LogdashSDKName.RUBY]: `require 'logdash'

logdash_client = Logdash.create(api_key: "${apiKey}")

logger = logdash_client[:logger]

logger.info('Application started successfully')
logger.error('An unexpected error occurred')
logger.warn('Low disk space warning')

# wait to ensure logs were sent
sleep 5`,
    [LogdashSDKName.DOTNET]: `using Logdash;
using Logdash.Models;

var builder = new LogdashBuilder();
var (logdash, metrics) = builder.WithHttpClient(new HttpClient())
    .WithInitializationParams(new InitializationParams("${apiKey}"))
    .Build();

logger.Info("Application started successfully");
logger.Error("An unexpected error occurred");
logger.Warn("Low disk space warning");

// wait to ensure logs were sent
await Task.Delay(5000);`,
    [LogdashSDKName.RUST]: `let (logger, _) = logdash::create_logdash(logdash::Config::default().api_key("${apiKey}".into()));

logger.info("Application started successfully");
logger.error("An unexpected error occurred");
logger.warn("Low disk space warning");

// wait to ensure logs were sent
thread::sleep(Duration::from_secs(5));`,
    [LogdashSDKName.GO]: `ld := logdash.New(
  logdash.WithApiKey("${apiKey}"),
)

logger := logdash.logger

logger.Info("Application started successfully")
logger.Error("An unexpected error occurred")
logger.Warn("Low disk space warning")

// wait to ensure logs were sent
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
ld.Shutdown(ctx)`,
    [LogdashSDKName.CURL]: `curl -X POST "https://api.logdash.io/logs" \\
-H "project-api-key: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{"message": "Application started successfully", "level": "info", "createdAt": "${new Date().toISOString()}", "sequenceNumber": 0}'`,
  };

  return snippets[sdkName];
}

export function generateSetupPrompt(
  sdkName: LogdashSDKName,
  apiKey: string,
): string {
  const installCommand = INSTALL_COMMANDS[sdkName];
  const codeSnippet = getCodeSnippet(sdkName, apiKey);

  const nodeJsExtra =
    sdkName === LogdashSDKName.NODE_JS
      ? `Ask me if I would like to monkey patch the default console object and if yes, create a monkey patch function that will send the log to Logdash. Like:

function monkeyPatchConsole(): void {
  console.log = (...args) => {
    logdash.debug(...args);
  };
  console.info = (...args) => {
    logdash.info(...args);
  };
  console.warn = (...args) => {
    logdash.warn(...args);
  };
  console.error = (...args) => {
    logdash.error(...args);
  };
}

and include it at the beginning of the application entry point.`
      : '';

  return `Integrate Logdash as a default logger for my ${sdkName} application.  
First, install the package using default repo package manager, otherwise fallback to the following command:

${installCommand}

Here's the example usage:

${codeSnippet}

Save that preference to the project settings and your memory. Act like a cli setup assistant and ask me about my prefered level of integration:
- recommended (every single log statement is sent to Logdash)
- minimal (only critical errors and warnings are sent to Logdash)

${nodeJsExtra}
`;
}
