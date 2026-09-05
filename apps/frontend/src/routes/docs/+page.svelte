<script lang="ts">
  import { resolve } from '$app/paths';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import { sdkDocs } from '$lib/landing/docs/sdk-docs.data';
  import CodeBlock from '$lib/landing/guides/blocks/CodeBlock.svelte';
  import { SDKS, type DocsPath } from '$lib/landing/guides/documentation.data';

  const sdks = sdkDocs.map((doc) => ({
    doc,
    icon: SDKS.find((sdk) => sdk.id === doc.id)?.icon,
  }));

  /**
   * Most installs are one line, but Java ships a Gradle block. Skip comments
   * and brace lines so every card shows the part you actually copy.
   */
  function installLine(code: string): string {
    const lines = code
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('//'));

    return lines.find((line) => !/^[{}]|[{}]$/.test(line)) ?? lines[0];
  }

  const moreLinks: { title: string; description: string; href: DocsPath }[] = [
    {
      title: 'Self-hosting',
      description:
        'What runs on your own machine today, and what still stops a production deployment.',
      href: '/docs/self-hosting',
    },
    {
      title: 'Guides',
      description:
        'Logging, metrics and monitoring explained, with the plan limits that apply to each.',
      href: '/guides',
    },
  ];

  const logsCurl = `curl -X POST "https://api.logdash.io/logs" \\
-H "project-api-key: <your-api-key>" \\
-H "Content-Type: application/json" \\
-d '{"message": "Application started successfully", "level": "info", "createdAt": "2026-09-04T09:41:00.000Z", "sequenceNumber": 0}'`;

  const metricsCurl = `curl -X PUT "https://api.logdash.io/metrics" \\
-H 'project-api-key: <your-api-key>' \\
-H 'Content-Type: application/json' \\
-d '{"name": "users", "value": 0, "operation": "set"}'`;

  const pingCurl = `curl -X POST "https://api.logdash.io/ping/<monitorId>"`;
</script>

<SeoMeta
  title="Docs | Logdash"
  description="Reference for the eight official Logdash SDKs and the HTTP API underneath them. Install, send your first log and your first metric."
  keywords="logdash docs, logdash sdk, logdash api, http api, send logs, send metrics"
  canonical="/docs"
/>

<!--
  Hand-rolled rather than a DocArticle page because the SDK grid here links to
  our own reference pages, while the shared `sdks` block still points at the
  GitHub READMEs.
-->
<article class="flex w-full max-w-2xl flex-col">
  <header class="flex flex-col gap-3">
    <h1 class="text-4xl font-medium tracking-[-0.03em]">Docs</h1>
    <p class="text-neutral-400 text-lg leading-7">
      Reference for the eight official SDKs and the HTTP API underneath them.
      Pick your language, or skip the SDK and post the JSON yourself.
    </p>
  </header>

  <div class="mt-10 flex flex-col gap-5">
    <h2 id="sdks" class="scroll-mt-24 text-xl font-medium tracking-[-0.02em]">
      SDKs
    </h2>
    <p class="text-neutral-400 text-[15px] leading-7">
      Each page covers installation, initialisation, one log, one metric and the
      questions people actually ask. Every snippet is copied from the SDK README
      it links back to.
    </p>

    <div
      class="bg-hairline border-hairline grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2"
    >
      {#each sdks as { doc, icon } (doc.slug)}
        {@const Icon = icon}
        <a
          href={resolve('/docs/[sdk]', { sdk: doc.slug })}
          class="bg-base-300 hover:bg-base-200 group flex items-center gap-3 px-4 py-3.5"
        >
          {#if Icon}
            <Icon class="size-4 shrink-0" />
          {/if}
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="text-[15px] leading-5">{doc.name}</span>
            <span class="text-neutral-500 truncate font-mono text-xs">
              {installLine(doc.install.code)}
            </span>
          </span>
          <ChevronRightIcon
            class="text-neutral-600 group-hover:text-base-content ml-auto size-4 shrink-0 transition-ink duration-150"
          />
        </a>
      {/each}
    </div>

    <h2
      id="raw-http-api"
      class="mt-6 scroll-mt-24 text-xl font-medium tracking-[-0.02em]"
    >
      Raw HTTP API
    </h2>
    <p class="text-neutral-400 text-[15px] leading-7">
      Every SDK is a wrapper around a handful of endpoints. If your language has
      no SDK, or you just want to prove the pipe works, curl it. Logs and
      metrics authenticate with your project API key in a
      <code class="font-mono text-[13px]">project-api-key</code>
      header.
    </p>

    <CodeBlock language="bash" title="POST /logs" code={logsCurl} />

    <CodeBlock language="bash" title="PUT /metrics" code={metricsCurl} />

    <p class="text-neutral-400 text-[15px] leading-7">
      Heartbeats are the exception. A push monitor exposes a public endpoint
      with no key and no body, so the URL is the secret. Call it on a schedule
      and Logdash marks the monitor down when the calls stop.
    </p>

    <CodeBlock language="bash" title="POST /ping/<monitorId>" code={pingCurl} />

    <h2
      id="more"
      class="mt-6 scroll-mt-24 text-xl font-medium tracking-[-0.02em]"
    >
      More
    </h2>

    <div class="border-hairline divide-hairline divide-y border-y">
      {#each moreLinks as link (link.href)}
        <a
          href={resolve(link.href)}
          class="group -mx-3 flex items-center gap-4 rounded-lg px-3 py-4"
        >
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="text-[15px] font-medium">{link.title}</span>
            <span class="text-neutral-400 text-sm">{link.description}</span>
          </div>
          <ChevronRightIcon
            class="text-neutral-600 group-hover:text-base-content ml-auto size-4 shrink-0 transition-ink duration-150"
          />
        </a>
      {/each}
    </div>
  </div>
</article>
