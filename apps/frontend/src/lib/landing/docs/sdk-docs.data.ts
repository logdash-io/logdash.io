import { LogdashSDKName } from '$lib/domains/shared/types';
import type { SdkDoc } from './sdk-doc';

/**
 * One record per SDK. Every install, init, log and metric snippet is copied
 * from the README pinned in `sourceRef`, trimmed to imports plus the call and
 * switched to an env-var API key so it pastes straight into a project.
 *
 * When an SDK README changes, diff it against the pinned sha, update the
 * snippet and bump `updatedAt`. Never write a method name that is not in the
 * README.
 */
export const sdkDocs: SdkDoc[] = [
  {
    slug: 'node',
    name: 'Node.js',
    id: LogdashSDKName.NODE_JS,
    repo: 'node-sdk',
    sourceRef: {
      url: 'https://github.com/logdash-io/node-sdk/blob/a29c017cc4a2830c5db8d7c7cd24a0d0c1d1e3a5/README.md',
      sha: 'a29c017cc4a2830c5db8d7c7cd24a0d0c1d1e3a5',
    },
    install: { language: 'bash', code: 'npm install @logdash/node' },
    init: {
      language: 'typescript',
      code: `import { Logdash } from '@logdash/node';

const logdash = new Logdash(process.env.LOGDASH_API_KEY);`,
    },
    log: {
      language: 'typescript',
      code: `import { Logdash } from '@logdash/node';

const logdash = new Logdash(process.env.LOGDASH_API_KEY);

logdash.info('Application started successfully');
logdash.error('An unexpected error occurred');
logdash.warn('Low disk space warning');`,
    },
    metric: {
      language: 'typescript',
      code: `import { Logdash } from '@logdash/node';

const logdash = new Logdash(process.env.LOGDASH_API_KEY);

// to set absolute value
logdash.setMetric('users', 0);

// to modify existing metric
logdash.mutateMetric('users', 1);`,
    },
    frameworks: ['Express', 'NestJS', 'Fastify', 'Next.js', 'SvelteKit', 'Bun'],
    faq: [
      {
        question: 'Does it work with TypeScript?',
        answer:
          'Yes. Every example in the README is TypeScript and `Logdash` is a named export. The same package runs on Node, Bun and Deno.',
      },
      {
        question: 'How do I stop losing logs when the process exits?',
        answer:
          'Await `logdash.flush()` before you exit. It sends everything still queued, which matters in short-lived processes like cron jobs and serverless handlers.',
      },
      {
        question: 'Can I point it at a self-hosted instance?',
        answer:
          'Yes. Pass `options.host` to the constructor. It defaults to `https://api.logdash.io`.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'python',
    name: 'Python',
    id: LogdashSDKName.PYTHON,
    repo: 'python-sdk',
    sourceRef: {
      url: 'https://github.com/logdash-io/python-sdk/blob/f1504adf57f02955aaa724e03e8de1d203f195bc/README.md',
      sha: 'f1504adf57f02955aaa724e03e8de1d203f195bc',
    },
    install: { language: 'bash', code: 'pip install logdash' },
    init: {
      language: 'python',
      code: `import os

from logdash import create_logdash

logdash = create_logdash({
    "api_key": os.environ["LOGDASH_API_KEY"],
})`,
    },
    log: {
      language: 'python',
      code: `import os

from logdash import create_logdash

logdash = create_logdash({"api_key": os.environ["LOGDASH_API_KEY"]})
logger = logdash.logger

logger.info("Application started successfully")
logger.error("An unexpected error occurred")
logger.warn("Low disk space warning")`,
    },
    metric: {
      language: 'python',
      code: `import os

from logdash import create_logdash

logdash = create_logdash({"api_key": os.environ["LOGDASH_API_KEY"]})
metrics = logdash.metrics

# to set absolute value
metrics.set("users", 0)

# to modify existing metric
metrics.mutate("users", 1)`,
    },
    frameworks: ['FastAPI', 'Django', 'Flask', 'Celery'],
    faq: [
      {
        question: 'Is the API key required?',
        answer:
          'No. Without one the logger still writes to your console. Metrics are hosted remotely only, so `metrics.set` and `metrics.mutate` need a key to show up anywhere.',
      },
      {
        question: 'Where do the logger and metrics objects come from?',
        answer:
          '`create_logdash` returns a client. Read `logdash.logger` for logging and `logdash.metrics` for counters and gauges.',
      },
      {
        question: 'Is there a Django or Flask integration?',
        answer:
          'No framework binding ships with the SDK. `create_logdash` is the whole surface, so build one client at startup and import it where you need it.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'go',
    name: 'Go',
    id: LogdashSDKName.GO,
    repo: 'go-sdk',
    sourceRef: {
      url: 'https://github.com/logdash-io/go-sdk/blob/b14658fa6a35b69591d432ef034f8942ba19dd74/README.md',
      sha: 'b14658fa6a35b69591d432ef034f8942ba19dd74',
    },
    install: {
      language: 'bash',
      code: 'go get github.com/logdash-io/go-sdk/logdash',
    },
    init: {
      language: 'go',
      code: `package main

import (
	"context"
	"os"
	"time"

	"github.com/logdash-io/go-sdk/logdash"
)

func main() {
	ld := logdash.New(
		logdash.WithApiKey(os.Getenv("LOGDASH_API_KEY")),
	)

	// Shutdown waits for every enqueued log and metric to flush.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	defer ld.Shutdown(ctx)
}`,
    },
    log: {
      language: 'go',
      code: `package main

import (
	"os"

	"github.com/logdash-io/go-sdk/logdash"
)

func main() {
	ld := logdash.New(logdash.WithApiKey(os.Getenv("LOGDASH_API_KEY")))
	logger := ld.Logger

	logger.Info("Application started successfully")
	logger.Error("An unexpected error occurred")

	// Every level has an ...F() counterpart, like fmt.Printf.
	logger.InfoF("Processing %v of %v item", 1, 10)
}`,
    },
    metric: {
      language: 'go',
      code: `package main

import (
	"os"

	"github.com/logdash-io/go-sdk/logdash"
)

func main() {
	ld := logdash.New(logdash.WithApiKey(os.Getenv("LOGDASH_API_KEY")))
	metrics := ld.Metrics

	// to set absolute value
	metrics.Set("users", 0)

	// or increment / decrement by
	metrics.Mutate("users", 1)
}`,
    },
    frameworks: ['net/http', 'log/slog', 'Gin', 'Echo', 'Fiber'],
    faq: [
      {
        question: 'Can I keep using log/slog?',
        answer:
          'Yes. Wrap the logger with `logdash.NewSlogTextHandler(ld.Logger, slog.HandlerOptions{})` and pass it to `slog.New`. Error maps to Error, Warn to Warn, Info to Info, Debug to Debug and anything below Debug to Silly.',
      },
      {
        question: 'How do I flush before the process exits?',
        answer:
          'Call `ld.Shutdown(ctx)` with a context deadline. It blocks until every queued log and metric has been sent or the context expires.',
      },
      {
        question: 'Is there a printf-style logging call?',
        answer:
          'Yes. Every level has an `...F()` counterpart, so `logger.InfoF("Processing %v of %v item", i+1, items)` works the way `fmt.Printf` does.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'dotnet',
    name: '.NET',
    id: LogdashSDKName.DOTNET,
    repo: 'dotnet-sdk',
    sourceRef: {
      url: 'https://github.com/logdash-io/dotnet-sdk/blob/d77d3d98d52bfeb8cb4a8cff589090f459bc241a/README.md',
      sha: 'd77d3d98d52bfeb8cb4a8cff589090f459bc241a',
    },
    install: { language: 'bash', code: 'dotnet add package Logdash' },
    init: {
      language: 'csharp',
      code: `using Logdash;
using Logdash.Models;

var apiKey = Environment.GetEnvironmentVariable("LOGDASH_API_KEY");

var (logdash, metrics) = new LogdashBuilder()
    .WithHttpClient(new HttpClient())
    .WithInitializationParams(new InitializationParams(apiKey))
    .Build();`,
    },
    log: {
      language: 'csharp',
      code: `logdash.Info("This is info message");
logdash.Warn("This is warn message");
logdash.Error("This is an error message");
logdash.Debug("This is a debug message");`,
    },
    metric: {
      language: 'csharp',
      code: `// to set absolute value
metrics.Set("key", 2);

// or increment / decrement by
metrics.Mutate("key", 3);`,
    },
    frameworks: [
      'ASP.NET Core',
      'Minimal APIs',
      'Worker Services',
      'Blazor',
      'Console apps',
    ],
    faq: [
      {
        question: 'How do I register it in ASP.NET Core?',
        answer:
          'Call `builder.Services.AddLogdash(new InitializationParams(apiKey))`, then take `ILogdashLogger` and `ILogdashMetrics` as constructor parameters in your controllers and services.',
      },
      {
        question: 'Can I use it without dependency injection?',
        answer:
          'Yes. `new LogdashBuilder().WithHttpClient(...).WithInitializationParams(...).Build()` returns a logger and a metrics client as a tuple.',
      },
      {
        question: 'What happens if I leave the API key out?',
        answer:
          'Logs go to the local console only. There is also a `host` parameter if you are running a self-hosted Logdash, and `verbose` if you need to debug the SDK itself.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'java',
    name: 'Java',
    id: LogdashSDKName.JAVA,
    repo: 'java-sdk',
    sourceRef: {
      url: 'https://github.com/logdash-io/java-sdk/blob/dc8b83986f8cd8dec863dce42b38373e1317e667/README.md',
      sha: 'dc8b83986f8cd8dec863dce42b38373e1317e667',
    },
    install: {
      language: 'java',
      code: `// build.gradle
dependencies {
    implementation 'io.logdash:logdash:0.2.0'
}`,
    },
    init: {
      language: 'java',
      code: `import io.logdash.sdk.Logdash;

var logdash = Logdash.builder()
        .apiKey(System.getenv("LOGDASH_API_KEY"))
        .build();

var logger = logdash.logger();
var metrics = logdash.metrics();`,
    },
    log: {
      language: 'java',
      code: `import java.util.Map;

logger.info("Application started");
logger.error("Database connection failed");

// Structured logging with context
logger.info("Payment processed", Map.of(
        "userId", 12345,
        "amount", 29.99,
        "currency", "USD"
));`,
    },
    metric: {
      language: 'java',
      code: `// Gauges - track current values
metrics.set("active_users", 1_250);

// Counters - track events and occurrences
metrics.mutate("api_requests", 1);`,
    },
    frameworks: ['Spring Boot', 'Quarkus', 'Micronaut', 'Standalone apps'],
    faq: [
      {
        question: 'How do I install it with Maven instead of Gradle?',
        answer:
          'Add the Maven Central coordinates to your `pom.xml`: groupId `io.logdash`, artifactId `logdash`, version `0.2.0`.',
      },
      {
        question: 'Which Java versions are supported?',
        answer: 'Java 17 and up. The SDK is tested on 17, 21 and 22.',
      },
      {
        question: 'Do logging calls block the request thread?',
        answer:
          'No. The SDK is async and calls return immediately. Defaults are a 15000 ms request timeout, 3 retries and 10 concurrent requests; call `logdash.flush()` and `logdash.close()` before shutdown.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'rust',
    name: 'Rust',
    id: LogdashSDKName.RUST,
    repo: 'rust-sdk',
    sourceRef: {
      url: 'https://github.com/logdash-io/rust-sdk/blob/af54838f859926953fc7d2f0bb7cbbda4397518c/README.md',
      sha: 'af54838f859926953fc7d2f0bb7cbbda4397518c',
    },
    install: { language: 'bash', code: 'cargo add logdash' },
    init: {
      language: 'rust',
      code: `// Config::default() reads LOGDASH_API_KEY from the environment.
let (logger, metrics) = logdash::create_logdash(logdash::Config::default());`,
    },
    log: {
      language: 'rust',
      code: `let (logger, _) = logdash::create_logdash(logdash::Config::default());

// Send an info log message
logger.info("Rust SDK example");`,
    },
    metric: {
      language: 'rust',
      code: `let (_, metrics) = logdash::create_logdash(logdash::Config::default());

// create a metric
metrics.set("users".into(), 0.0);

// or increment / decrement by
metrics.mutate("users".into(), 1.0);`,
    },
    frameworks: ['Axum', 'Actix Web', 'Rocket', 'Tokio', 'CLI binaries'],
    faq: [
      {
        question: 'Where does it read the API key from?',
        answer:
          '`logdash::Config::default()` picks up `LOGDASH_API_KEY` from the environment. To pass it explicitly, use `logdash::Config::default().api_key("your-api-key".into())`.',
      },
      {
        question: 'What does create_logdash return?',
        answer:
          'A `(logger, metrics)` tuple. Destructure the half you need and drop the other with `_`.',
      },
      {
        question: 'What types do metric names and values take?',
        answer:
          'The name is an owned string, so pass `"users".into()`, and the value is a float: `metrics.set("users".into(), 0.0)`.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'ruby',
    name: 'Ruby',
    id: LogdashSDKName.RUBY,
    repo: 'ruby-sdk',
    sourceRef: {
      url: 'https://github.com/logdash-io/ruby-sdk/blob/944f6d364502fcd21ba110a17233865e782b5e80/README.md',
      sha: '944f6d364502fcd21ba110a17233865e782b5e80',
    },
    install: { language: 'bash', code: 'gem install logdash' },
    init: {
      language: 'ruby',
      code: `require 'logdash'

logdash_client = Logdash.create(api_key: ENV['LOGDASH_API_KEY'])
logger = logdash_client[:logger]
metrics = logdash_client[:metrics]`,
    },
    log: {
      language: 'ruby',
      code: `logger.info('Application started successfully')
logger.error('An unexpected error occurred')
logger.warn('Low disk space warning')`,
    },
    metric: {
      language: 'ruby',
      code: `metrics.set('users', 0)
metrics.mutate('users', 1)`,
    },
    frameworks: ['Ruby on Rails', 'Sinatra', 'Rack', 'Sidekiq'],
    faq: [
      {
        question: 'How do I wire it into Rails?',
        answer:
          'Create `config/initializers/logdash.rb`, call `Logdash.create` inside `ActiveSupport.on_load(:after_initialize)` and assign `$logger` and `$metrics` so they are available app-wide.',
      },
      {
        question: 'What does Logdash.create return?',
        answer:
          'A hash. Read `client[:logger]` for logging and `client[:metrics]` for counters and gauges.',
      },
      {
        question: 'Which log levels does the logger expose?',
        answer:
          '`info`, `error`, `warn`, `debug`, `verbose`, `http` and `silly`.',
      },
    ],
    updatedAt: '2026-09-04',
  },
  {
    slug: 'php',
    name: 'PHP',
    id: LogdashSDKName.PHP,
    repo: 'php-sdk',
    sourceRef: {
      url: 'https://github.com/logdash-io/php-sdk/blob/d22e55bdd45f4ca18af4aa5546dc50cf0525e67b/README.md',
      sha: 'd22e55bdd45f4ca18af4aa5546dc50cf0525e67b',
    },
    install: { language: 'bash', code: 'composer require logdash/php-sdk' },
    init: {
      language: 'php',
      code: `<?php

require_once 'vendor/autoload.php';

use Logdash\\Logdash;

$logdash = Logdash::create([
    'apiKey' => $_ENV['LOGDASH_API_KEY'] ?? '',
]);

$logger = $logdash->logger();
$metrics = $logdash->metrics();`,
    },
    log: {
      language: 'php',
      code: `$logger->error('Application error occurred');
$logger->warn('This is a warning message');
$logger->info('User logged in successfully');`,
    },
    metric: {
      language: 'php',
      code: `$metrics->set('active_users', 150);
$metrics->mutate('login_count', 1); // Increment by 1
$metrics->mutate('error_count', -1); // Decrement by 1`,
    },
    frameworks: ['Laravel', 'Symfony', 'Slim', 'WordPress', 'Plain PHP'],
    faq: [
      {
        question: 'What happens if Logdash is unreachable?',
        answer:
          'Nothing breaks. The SDK is non-blocking and fails silently in production, local logging keeps working, and API errors are only surfaced when you pass `verbose => true`.',
      },
      {
        question: 'How do I use it in Laravel?',
        answer:
          'Bind it as a singleton in a service provider with `Logdash::create([...])`, then call `app("logdash")->logger()`. Symfony gets the same object through a `services.yaml` factory.',
      },
      {
        question: 'Which PHP version does it need?',
        answer:
          'PHP 8.1 or higher, tested on 8.1, 8.2 and 8.3. Composer pulls in the Guzzle HTTP client for you.',
      },
    ],
    updatedAt: '2026-09-04',
  },
];
