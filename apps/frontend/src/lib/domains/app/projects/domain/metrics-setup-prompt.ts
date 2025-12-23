import { LogdashSDKName } from '$lib/domains/shared/types.js';
import { INSTALL_COMMANDS } from '$lib/domains/logs/domain/sdk-config.js';

export function getMetricsCodeSnippet(
  sdkName: LogdashSDKName,
  apiKey: string,
): string {
  const snippets: Record<LogdashSDKName, string> = {
    [LogdashSDKName.NODE_JS]: `import { Logdash } from '@logdash/node';

const logdash = new Logdash("${apiKey}");

logdash.setMetric('users', 0);
logdash.mutateMetric('users', 1);

logdash.flush();`,
    [LogdashSDKName.PYTHON]: `from logdash import create_logdash

logdash = create_logdash({
    "api_key": "${apiKey}",
})

metrics = logdash.metrics

metrics.set("users", 0)
metrics.mutate("users", 1)

time.sleep(5)`,
    [LogdashSDKName.JAVA]: `import io.logdash.sdk.Logdash;

var logdash = Logdash.builder()
        .apiKey("${apiKey}")
        .build();

var metrics = logdash.metrics();

metrics.set("users", 0);
metrics.mutate("users", 1);

logdash.close();`,
    [LogdashSDKName.PHP]: `<?php

require_once 'vendor/autoload.php';

use Logdash\\Logdash;

$logdash = Logdash::create([
    'apiKey' => '${apiKey}'
]);

$metrics = $logdash->metrics();

$metrics->set('users', 0);
$metrics->mutate('users', 1);`,
    [LogdashSDKName.RUBY]: `require 'logdash'

logdash_client = Logdash.create(api_key: "${apiKey}")

metrics = logdash_client[:metrics]

metrics.set('users', 0)
metrics.mutate('users', 1)

sleep 5`,
    [LogdashSDKName.DOTNET]: `using Logdash;
using Logdash.Models;

var builder = new LogdashBuilder();
var (logdash, metrics) = builder.WithHttpClient(new HttpClient())
    .WithInitializationParams(new InitializationParams("${apiKey}"))
    .Build();
    
metrics.Set("users", 0);
metrics.Mutate("users", 1);

await Task.Delay(5000);`,
    [LogdashSDKName.RUST]: `let (_, m) = logdash::create_logdash(logdash::Config::default().api_key("${apiKey}".into()));

m.set("user".into(), 0.0);
m.mutate("user".into(), 1.0);

thread::sleep(Duration::from_secs(5));`,
    [LogdashSDKName.GO]: `ld := logdash.New(
  logdash.WithApiKey("${apiKey}"),
)

metrics := ld.Metrics

metrics.Set("users", 0)
metrics.Mutate("users", 1)

ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
ld.Shutdown(ctx)`,
    [LogdashSDKName.CURL]: `curl -X PUT "https://api.logdash.io/metrics" \\
-H 'project-api-key: ${apiKey}' \\
-H 'Content-Type: application/json' \\
-d '{"name": "users", "value": 0, "operation": "set"}'`,
  };

  return snippets[sdkName];
}

export function generateMetricsSetupPrompt(
  sdkName: LogdashSDKName,
  apiKey: string,
): string {
  const installCommand = INSTALL_COMMANDS[sdkName];
  const codeSnippet = getMetricsCodeSnippet(sdkName, apiKey);

  return `Integrate Logdash metrics for my ${sdkName} application.  
First, install the package using default repo package manager, otherwise fallback to the following command:

${installCommand}

Here's the example usage for tracking metrics:

${codeSnippet}

Key concepts:
- metrics.set(name, value) - sets an absolute value for a metric
- metrics.mutate(name, delta) - increments/decrements a metric by the given amount

Save that preference to the project settings and your memory. Help me integrate metrics tracking into my application by identifying key metrics to track (e.g., user counts, request counts, error rates).
`;
}
