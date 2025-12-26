import { LogdashSDKName } from '$lib/domains/shared/types.js';
import { INSTALL_COMMANDS } from '$lib/domains/logs/domain/sdk-config.js';
import { getCodeSnippet } from '$lib/domains/logs/domain/setup-prompt.js';
import { getMetricsCodeSnippet } from './metrics-setup-prompt.js';
import { PromptBuilder } from './prompt-builder.js';

export function generateUnifiedSetupPrompt(
  sdkName: LogdashSDKName,
  apiKey: string,
  needsLogging: boolean,
  needsMetrics: boolean,
): string {
  if (isNodeEcosystem(sdkName)) {
    return buildNodeEcosystemPrompt(
      sdkName,
      apiKey,
      needsLogging,
      needsMetrics,
    );
  }

  return buildStandardPrompt(sdkName, apiKey, needsLogging, needsMetrics);
}

function buildNodeEcosystemPrompt(
  sdkName: LogdashSDKName,
  apiKey: string,
  needsLogging: boolean,
  needsMetrics: boolean,
): string {
  const builder = new PromptBuilder();
  const installCommand = INSTALL_COMMANDS[sdkName];

  const featuresText =
    needsLogging && needsMetrics
      ? 'logging and metrics'
      : needsLogging
        ? 'logging'
        : 'metrics';

  builder.addHeader(
    `Integrate Logdash ${featuresText} for my ${sdkName} application.`,
  );

  builder.addInstallCommand(installCommand);

  if (needsLogging) {
    let loggingSnippet: string;
    switch (sdkName) {
      case LogdashSDKName.NEXT_JS:
        loggingSnippet = getNextJsLoggingSnippet(apiKey);
        break;
      case LogdashSDKName.SVELTE_KIT:
        loggingSnippet = getSvelteKitLoggingSnippet(apiKey);
        break;
      default:
        loggingSnippet = getNodeJsLoggingSnippet(apiKey);
    }

    builder.addSection('Logging Integration', loggingSnippet);
  }

  if (needsMetrics) {
    let metricsSnippet: string;
    switch (sdkName) {
      case LogdashSDKName.NEXT_JS:
        metricsSnippet = getNextJsMetricsSnippet(apiKey);
        break;
      case LogdashSDKName.SVELTE_KIT:
        metricsSnippet = getSvelteKitMetricsSnippet(apiKey);
        break;
      default:
        metricsSnippet = getNodeJsMetricsSnippet(apiKey);
    }

    builder.addSection('Metrics Integration', metricsSnippet);

    builder.addParagraph(`Key metrics concepts:
- setMetric(name, value) - sets an absolute value for a metric
- mutateMetric(name, delta) - increments/decrements a metric by the given amount`);
  }

  builder.addParagraph(
    `Save that preference to the project settings and your memory. Act like a CLI setup assistant and ask me about my preferred level of integration:
- recommended (comprehensive integration with logging/metrics throughout the app)
- minimal (only critical paths and error handling)`,
  );

  if (sdkName === LogdashSDKName.NODE_JS) {
    builder.addParagraph(`Ask me if I would like to monkey patch the default console object and if yes, create a monkey patch function that will send the log to Logdash. Like:

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

and include it at the beginning of the application entry point.`);
  }

  return builder.build();
}

function buildStandardPrompt(
  sdkName: LogdashSDKName,
  apiKey: string,
  needsLogging: boolean,
  needsMetrics: boolean,
): string {
  const builder = new PromptBuilder();
  const installCommand = INSTALL_COMMANDS[sdkName];

  const featuresText =
    needsLogging && needsMetrics
      ? 'logging and metrics'
      : needsLogging
        ? 'logging'
        : 'metrics';

  builder.addHeader(
    `Integrate Logdash ${featuresText} for my ${sdkName} application.`,
  );

  builder.addInstallCommand(installCommand);

  if (needsLogging) {
    const loggingSnippet = getCodeSnippet(sdkName, apiKey);
    builder.addSection('Logging Integration', loggingSnippet);
  }

  if (needsMetrics) {
    const metricsSnippet = getMetricsCodeSnippet(sdkName, apiKey);
    builder.addSection('Metrics Integration', metricsSnippet);

    builder.addParagraph(`Key metrics concepts:
- set(name, value) - sets an absolute value for a metric
- mutate(name, delta) - increments/decrements a metric by the given amount`);
  }

  builder.addParagraph(
    `Save that preference to the project settings and your memory. Help me integrate ${featuresText} into my application.`,
  );

  return builder.build();
}

function isNodeEcosystem(sdkName: LogdashSDKName): boolean {
  return NODE_ECOSYSTEM_SDKS.includes(sdkName);
}

function getNodeJsLoggingSnippet(apiKey: string): string {
  return `import { Logdash } from '@logdash/node';

const logdash = new Logdash("${apiKey}");

logdash.info("Application started successfully");
logdash.error("An unexpected error occurred");
logdash.warn("Low disk space warning");

const authLogdash = logdash.withNamespace('auth');
authLogdash.info("User authenticated successfully");

logdash.flush();`;
}

function getNodeJsMetricsSnippet(apiKey: string): string {
  return `import { Logdash } from '@logdash/node';

const logdash = new Logdash("${apiKey}");

logdash.setMetric('users', 0);
logdash.mutateMetric('users', 1);

logdash.flush();`;
}

function getNextJsLoggingSnippet(apiKey: string): string {
  return `// lib/logdash.ts - shared instance
import { Logdash } from '@logdash/node';

export const logdash = new Logdash("${apiKey}");

// middleware.ts - log all incoming requests
import { logdash } from './lib/logdash';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  logdash.info(\`Request: \${request.method} \${request.nextUrl.pathname}\`);
  return NextResponse.next();
}

// app/api/example/route.ts - API route logging
import { logdash } from '@/lib/logdash';

export async function GET() {
  logdash.info("API route called");
  return Response.json({ success: true });
}`;
}

function getNextJsMetricsSnippet(apiKey: string): string {
  return `// lib/logdash.ts - shared instance
import { Logdash } from '@logdash/node';

export const logdash = new Logdash("${apiKey}");

// middleware.ts - track edge function performance
import { logdash } from './lib/logdash';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();
  const duration = Date.now() - start;
  
  logdash.mutateMetric('middleware_calls', 1);
  logdash.setMetric('last_middleware_duration_ms', duration);
  
  return response;
}

// app/api/users/route.ts - track API metrics
import { logdash } from '@/lib/logdash';

export async function POST() {
  logdash.mutateMetric('user_signups', 1);
  return Response.json({ success: true });
}`;
}

function getSvelteKitLoggingSnippet(apiKey: string): string {
  return `// src/lib/logdash.ts - shared instance
import { Logdash } from '@logdash/node';

export const logdash = new Logdash("${apiKey}");

// src/hooks.server.ts - log all incoming requests
import { logdash } from '$lib/logdash';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  logdash.info(\`Request: \${event.request.method} \${event.url.pathname}\`);
  return resolve(event);
};

// src/routes/api/example/+server.ts - API endpoint logging
import { logdash } from '$lib/logdash';
import { json } from '@sveltejs/kit';

export function GET() {
  logdash.info("API endpoint called");
  return json({ success: true });
}`;
}

function getSvelteKitMetricsSnippet(apiKey: string): string {
  return `// src/lib/logdash.ts - shared instance
import { Logdash } from '@logdash/node';

export const logdash = new Logdash("${apiKey}");

// src/hooks.server.ts - track route load performance
import { logdash } from '$lib/logdash';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  const response = await resolve(event);
  const duration = Date.now() - start;
  
  logdash.mutateMetric('route_requests', 1);
  logdash.setMetric('last_route_duration_ms', duration);
  
  return response;
};

// src/routes/+page.server.ts - track page load metrics
import { logdash } from '$lib/logdash';

export async function load() {
  const start = Date.now();
  
  const data = await fetchData();
  
  logdash.setMetric('page_load_duration_ms', Date.now() - start);
  return data;
}`;
}

const NODE_ECOSYSTEM_SDKS = [
  LogdashSDKName.NODE_JS,
  LogdashSDKName.NEXT_JS,
  LogdashSDKName.SVELTE_KIT,
];
